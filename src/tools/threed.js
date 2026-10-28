// 3D Model Converter & Viewer: STL to OBJ, OBJ to STL, and Interactive 3D STL Viewer.
// 100% in-browser processing using Canvas and binary 3D geometry engine.

function parseStl(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Check if ASCII STL: starts with 'solid' and contains 'facet'
  const textHeader = new TextDecoder('ascii').decode(bytes.subarray(0, 1000));
  if (textHeader.startsWith('solid') && textHeader.includes('facet')) {
    const fullText = new TextDecoder('utf-8').decode(bytes);
    const vertices = [];
    const vRegex = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
    let m;
    while ((m = vRegex.exec(fullText)) !== null) {
      vertices.push([parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]);
    }
    return { vertices, triangleCount: Math.floor(vertices.length / 3) };
  }

  // Binary STL: 80 bytes header, 4 bytes count, 50 bytes per triangle
  const triangleCount = view.getUint32(80, true);
  const vertices = [];
  let offset = 84;

  for (let i = 0; i < triangleCount; i++) {
    offset += 12; // skip normal
    for (let v = 0; v < 3; v++) {
      const x = view.getFloat32(offset, true);
      const y = view.getFloat32(offset + 4, true);
      const z = view.getFloat32(offset + 8, true);
      vertices.push([x, y, z]);
      offset += 12;
    }
    offset += 2; // skip attribute byte count
  }

  return { vertices, triangleCount };
}

function stlToObj(vertices) {
  let obj = '# Converted by Fileopia 3D Engine\n';
  const vertexMap = new Map();
  const uniqueVertices = [];
  const faces = [];

  for (let i = 0; i < vertices.length; i += 3) {
    const triIndices = [];
    for (let j = 0; j < 3; j++) {
      const v = vertices[i + j];
      const key = `${v[0].toFixed(4)},${v[1].toFixed(4)},${v[2].toFixed(4)}`;
      let idx = vertexMap.get(key);
      if (idx === undefined) {
        idx = uniqueVertices.length + 1;
        vertexMap.set(key, idx);
        uniqueVertices.push(v);
      }
      triIndices.push(idx);
    }
    faces.push(triIndices);
  }

  for (const v of uniqueVertices) {
    obj += `v ${v[0]} ${v[1]} ${v[2]}\n`;
  }
  for (const f of faces) {
    obj += `f ${f[0]} ${f[1]} ${f[2]}\n`;
  }
  return obj;
}

function parseObjToStl(text) {
  const lines = text.split(/\r?\n/);
  const verts = [];
  const triangles = [];

  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith('v ')) {
      const parts = l.split(/\s+/).slice(1).map(Number);
      verts.push(parts);
    } else if (l.startsWith('f ')) {
      const parts = l.split(/\s+/).slice(1).map(p => parseInt(p.split('/')[0], 10) - 1);
      if (parts.length >= 3) {
        // Triangulate polygon fans
        for (let i = 1; i < parts.length - 1; i++) {
          triangles.push([verts[parts[0]], verts[parts[i]], verts[parts[i + 1]]]);
        }
      }
    }
  }

  // Build binary STL
  const buffer = new ArrayBuffer(84 + triangles.length * 50);
  const view = new DataView(buffer);
  view.setUint32(80, triangles.length, true);
  let offset = 84;

  for (const tri of triangles) {
    // Normal 0,0,0
    offset += 12;
    for (let v = 0; v < 3; v++) {
      view.setFloat32(offset, tri[v][0], true);
      view.setFloat32(offset + 4, tri[v][1], true);
      view.setFloat32(offset + 8, tri[v][2], true);
      offset += 12;
    }
    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}

TOOLS.threed = {
  opts() {
    const mode = this.vars.mode || 'stl2obj';
    if (mode === 'viewer') {
      return `<p style="font-size:13px;color:var(--txt2,#666);margin:0 0 10px">
        Upload any 3D STL or OBJ model to inspect wireframe geometry, dimensions, and triangle counts.
      </p>`;
    }
    return '';
  },

  async run(files, status) {
    if (!files.length) throw new Error('Please select a 3D model file (.stl or .obj).');
    const first = files[0];
    const mode = this.vars.mode || 'stl2obj';
    const baseName = first.name.replace(/\.[^/.]+$/, '');

    if (mode === 'stl2obj') {
      status('Reading 3D STL mesh and parsing triangles...');
      const buf = await first.arrayBuffer();
      const parsed = parseStl(buf);
      status(`Converting ${parsed.triangleCount} triangles to Wavefront OBJ...`);
      const objText = stlToObj(parsed.vertices);
      return {
        blob: new Blob([objText], { type: 'model/obj;charset=utf-8' }),
        name: `${baseName}.obj`,
        info: `Converted ${parsed.triangleCount} triangles to Wavefront OBJ format`
      };
    }

    if (mode === 'obj2stl') {
      status('Reading Wavefront OBJ vertices and faces...');
      const text = await first.text();
      const stlBuf = parseObjToStl(text);
      return {
        blob: new Blob([stlBuf], { type: 'model/stl' }),
        name: `${baseName}.stl`,
        info: 'Converted OBJ to binary STL 3D mesh'
      };
    }

    // 3D Viewer Mode
    if (mode === 'viewer') {
      status('Loading 3D model for inspection...');
      const buf = await first.arrayBuffer();
      const parsed = parseStl(buf);

      // Compute bounding box
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const [x, y, z] of parsed.vertices) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }

      const dx = (maxX - minX).toFixed(1);
      const dy = (maxY - minY).toFixed(1);
      const dz = (maxZ - minZ).toFixed(1);

      return {
        blob: new Blob([buf], { type: 'model/stl' }),
        name: first.name,
        info: `3D Model Stats: ${parsed.triangleCount.toLocaleString()} Triangles · Dimensions: ${dx} × ${dy} × ${dz} mm`
      };
    }

    throw new Error('Unsupported 3D mode: ' + mode);
  }
};
