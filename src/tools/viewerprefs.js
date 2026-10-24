// @needs pdfx
// Viewer preferences: how the PDF opens (page layout, panel, zoom-fit, hide toolbar, show title)
TOOLS.viewerprefs={opts:()=>sel('vlayout',T.o_vLayout,[['','—'],['SinglePage',T.o_vSingle],['OneColumn',T.o_vScroll],['TwoPageLeft',T.o_vTwo],['TwoPageRight',T.o_vTwoCover],['TwoColumnLeft',T.o_vTwoScroll]])+sel('vmode',T.o_vMode,[['','—'],['UseNone',T.o_vNone],['UseOutlines',T.o_vBookmarks],['UseThumbs',T.o_vThumbs],['FullScreen',T.o_vFull]])+
  chk('vfit',T.o_vFit,false)+chk('vcenter',T.o_vCenter,false)+chk('vtitle',T.o_vTitle,true)+chk('vtool',T.o_vHideTool,false)+chk('vmenu',T.o_vHideMenu,false),
 async run([f]){const {PDFDocument,PDFName,PDFBool}=await L.pdflib();const d=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const c=d.catalog;
  if(v('vlayout'))c.set(PDFName.of('PageLayout'),PDFName.of(v('vlayout')));if(v('vmode'))c.set(PDFName.of('PageMode'),PDFName.of(v('vmode')));
  const vp=d.context.obj({});for(const [id,k] of [['vfit','FitWindow'],['vcenter','CenterWindow'],['vtitle','DisplayDocTitle'],['vtool','HideToolbar'],['vmenu','HideMenubar']])if(vb(id))vp.set(PDFName.of(k),PDFBool.True);
  c.set(PDFName.of('ViewerPreferences'),vp);if(vb('vtitle')&&!d.getTitle())d.setTitle(base(f.name));
  return {blob:pdfBlob(await d.save()),name:base(f.name)+'-prefs.pdf'};}};
