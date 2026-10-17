# x7: extra sections + internal links for the original long-form guides that were still short or had no internal links
def _add(slug, extra, at=-1):
  t, ps = LONG[slug]
  ps = list(ps)
  i = len(ps) + at + 1 if at < 0 else at
  LONG[slug] = (t, ps[:i] + extra + ps[i:])

_add('album-cover-dimensions', [
"## Spine width and sheet count",
"On a wrap-around cover the spine is the one measurement you cannot guess. It grows with every sheet you add and with the paper and board thickness the lab uses, so a 20-sheet album and a 40-sheet album of the same size need different cover files. Finish the inside page plan first, confirm the final sheet count with the client, and only then request the cover template. If you design the cover early, keep the spine area as plain background so it can be stretched or trimmed without redesigning anything.",
"## Matching the cover to the inside pages",
"A cover should feel like the first page of the story, not a separate product. Reuse the font pair and one ornament from the opening spread, and pick the cover photo from the couple portrait session rather than the ceremony. Browse the [album cover PSD collection](/category/album-cover/) for front panels at 12x18 and other closed sizes, or start from a matching [12x36 album sheet](/category/wedding-album-12x36/) and build the cover from its background. Our [album cover design guide](/blog/album-cover-design-guide/) covers typography and photo choice in more detail.",
])

_add('birthday-album-psd-ideas', [
"## Sizes and paper for kids' albums",
"Birthday albums are often smaller than wedding albums. 12x36 is still common for big first birthday functions, but many parents prefer a 12x30 or 12x18 book that is easier for grandparents to hold and less expensive to reprint. Matte or lustre paper suits pastel themes and hides fingerprints, which matters for an album children will handle. Ask the lab about thicker sheets or a protective laminate if the album will be passed around at family gatherings.",
"## Where to find templates",
"Start with the [birthday and baby album category](/category/birthday-baby-album/), filter by sheet size, and keep one template family for the whole book. For newborn and naming ceremony pages, see our [baby album design guide](/blog/baby-album-design-guide/) and [newborn album tips](/blog/newborn-baby-album-design-tips/). If the party had a printed invitation, a matching [invitation PSD](/category/wedding-invitation/) layout can be adapted as the album's opening page.",
])

_add('rgb-vs-cmyk-for-albums', [
"## A quick test print saves arguments",
"If you are starting with a new lab, send one test spread before the full album. Pick a sheet with skin tones, a saturated saree, gold ornaments and a dark area, export it as an sRGB JPG and ask for it to be printed without automatic correction. Compare the print to your screen in daylight, not under a yellow tube light. If the print is darker, lower your monitor brightness rather than brightening every photo. If the colours shift, ask the lab for its ICC profile and soft-proof with View > Proof Setup > Custom in Photoshop.",
"Keep that test print at your desk as a reference for every future album you send to the same lab. Related reading: the [print-ready PSD checklist](/blog/print-ready-psd-checklist/), [album colour correction tips](/blog/album-colour-correction-tips/) and [how to send album files to the lab](/blog/send-album-files-to-lab/).",
])

_add('print-ready-psd-checklist', [
"## Before you start: a two-minute setup",
"Most items on this checklist are easier to get right at the beginning than to fix at the end. When you open a new template, check Image Size, set the colour profile, drop guides for the fold and the safe area, and save the file with a page number in its name. If the template is a different size from your lab's sheet, resize the empty template first; our guide to [resizing an album PSD to another size](/blog/resize-album-psd-to-another-size/) explains how to do this without stretching ornaments.",
"## Final check on the whole album",
"After every spread passes the checklist, review the album as a set: open the exported JPGs in a viewer and step through them in order. Look for repeated photos, uneven colour between events and pages that feel crowded next to calm ones. Then follow our steps to [send the album files to the lab](/blog/send-album-files-to-lab/). If you need more layouts at the right size, browse the [12x36 album PSDs](/category/wedding-album-12x36/) and [12x30 album PSDs](/category/album-12x30/).",
])

_add('how-to-download-psd-files', [
"## Opening the file after download",
"Large album PSDs are usually delivered as ZIP files. Extract them fully before opening; double-clicking a PSD inside a ZIP preview often fails or opens a temporary copy you may lose. On Windows, right-click and choose Extract All, or use 7-Zip. If extraction stops with an error, the download was probably interrupted, so download it again on a stable connection. Our [ZIP extraction troubleshooting guide](/blog/how-to-fix-zip-extraction-errors/) covers the common messages.",
"Once extracted, open the PSD in Photoshop and check the canvas size before editing. If you do not have Photoshop, see [editing a PSD without Photoshop](/blog/edit-psd-without-photoshop/) for the limits of free tools. New to the format? Read [what a PSD file is](/blog/what-is-a-psd-file/), then browse the [12x36 wedding album PSDs](/category/wedding-album-12x36/) or [studio background PSDs](/category/studio-background/) to pick your first template.",
])

_add('how-to-change-studio-background-in-photoshop', [
"## Lighting the shoot for an easy swap",
"A background change is much easier when it is planned at the shoot. Use a plain, evenly lit backdrop in a colour that does not appear in the clothes, keep the subject a few feet in front of it to avoid shadows and colour spill, and light the backdrop separately if you can. A small rim light on hair and shoulders gives Select Subject a clean edge to find. Our [studio background setup tips](/blog/studio-background-setup-tips/) go into lighting and backdrop choice.",
"## Choosing the new background",
"Pick a replacement whose light direction and perspective match the photo: a background lit from the left will look wrong behind a subject lit from the right. A subtle Gaussian Blur on the background layer helps it sit behind the subject like a real backdrop. Browse the [studio background PSD collection](/category/studio-background/) and [album backgrounds](/category/album-background/), and read the [studio backdrop PSD guide](/blog/studio-backdrop-psd-guide/) for more ideas.",
])

_add('karizma-album-design-tips', [
"Further reading: compare [photo books and Karizma albums](/blog/photo-book-vs-karizma-album/), see what affects [Karizma album printing cost](/blog/karizma-album-printing-cost-factors/), or browse the [Karizma album PSD collection](/tag/karizma-album-psd/) and [12x36 album sheets](/category/wedding-album-12x36/).",
])

_add('how-to-make-wedding-album-in-photoshop', [
"Related guides: [organising photos before album design](/blog/organise-photos-before-album-design/), [how many pages a wedding album needs](/blog/how-many-pages-in-a-wedding-album/) and the [print-ready PSD checklist](/blog/print-ready-psd-checklist/). Templates to start with: [12x36 wedding album PSDs](/category/wedding-album-12x36/) and [album covers](/category/album-cover/).",
])

_add('12x36-album-size-guide', [
"Related: [12x30 vs 12x36 albums](/blog/12x30-vs-12x36-album/), [12x36 vs 14x40](/blog/12x36-vs-14x40-album/), [wedding album sizes in India](/blog/wedding-album-sizes-india/) and [photo print sizes in pixels and DPI](/blog/photo-print-sizes-pixels-dpi/). Ready-made sheets: [12x36 wedding album PSDs](/category/wedding-album-12x36/).",
])

_add('how-to-edit-wedding-album-psd', [
"Next steps: learn [clipping masks](/blog/clipping-masks-explained/) in more depth, pick up useful [Photoshop shortcuts for album design](/blog/photoshop-shortcuts-album-design/), and choose [fonts for wedding albums](/blog/fonts-for-wedding-albums/). Practise on a free [12x36 wedding album PSD](/category/wedding-album-12x36/) or a [12x18 album sheet](/category/album-12x18/).",
])
