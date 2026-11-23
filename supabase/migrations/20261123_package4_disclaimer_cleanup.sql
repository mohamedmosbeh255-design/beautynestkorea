-- Package 4: remove article-body disclaimer duplicates now that the
-- article templates render one merged ArticleNotice at the top plus
-- EducationalDisclaimer at the end. Targeted, exact-string edits only:
-- article-specific medical warnings are intentionally left untouched.
-- Safe to run once; every replace() is a no-op on a second run.

begin;

-- how-to-use-celimax-retinal-shot-without-irritation
update public.articles set content = replace(content, $pkg4$> Our picks are cosmetic product recommendations, not medical prescriptions. Prices and ratings as of November 10, 2026 · These may change at any time; please check the respective store for the most up-to-date information.$pkg4$, '') where slug = 'how-to-use-celimax-retinal-shot-without-irritation';

-- winter-skin-rescue-restore-skin-barrier
update public.articles set content = replace(content, $pkg4$> **Our picks are cosmetic product recommendations, not medical prescriptions.** Some links are affiliate links — we may earn a commission at no extra cost to you. Educational only — cosmetic guidance and product curation, not medical advice.$pkg4$, '') where slug = 'winter-skin-rescue-restore-skin-barrier';

-- cerave-vs-cetaphil-vs-neutrogena-best-drugstore-moisturizer
update public.articles set content = replace(content, $pkg4$> **Our picks are cosmetic product recommendations, not medical prescriptions.** Some links are affiliate links — we may earn a commission at no extra cost to you.$pkg4$, '') where slug = 'cerave-vs-cetaphil-vs-neutrogena-best-drugstore-moisturizer';
update public.articles set content = replace(content, $pkg4$> Educational only — cosmetic guidance and product curation, not medical advice. Patch-test new products and see a dermatologist for persistent issues.$pkg4$, '') where slug = 'cerave-vs-cetaphil-vs-neutrogena-best-drugstore-moisturizer';

-- chemical-vs-mineral-vs-hybrid-sunscreen
update public.articles set content = replace(content, $pkg4$*BeautyNestKorea is an editorial site: product links may be affiliate links, which do not affect our recommendations. This article is educational and is not medical advice.*$pkg4$, '') where slug = 'chemical-vs-mineral-vs-hybrid-sunscreen';

-- fall-skincare-routine
update public.articles set content = replace(content, $pkg4$*This article is educational and is not medical advice.*$pkg4$, '') where slug = 'fall-skincare-routine';

-- acne-reset-treatment-plan
update public.articles set content = replace(content, $pkg4$Some links are affiliate links—we may earn a commission at no extra cost to you.$pkg4$, '') where slug = 'acne-reset-treatment-plan';
update public.articles set content = replace(content, $pkg4$*Editorial note: This article is educational and does not replace diagnosis. If acne is painful, scarring, or persistent, see a clinician.*$pkg4$, '') where slug = 'acne-reset-treatment-plan';

-- korean-skincare-routine-oily-acne-prone-skin
update public.articles set content = replace(content, $pkg4$*This article provides general skincare education and is not a substitute for medical advice.*$pkg4$, '') where slug = 'korean-skincare-routine-oily-acne-prone-skin';

-- what-causes-blackheads
update public.articles set content = replace(content, $pkg4$**Disclosure: This article contains affiliate links. As an Amazon Associate and Stylevana partner, BeautyNestKorea earns from qualifying purchases at no additional cost to you.**$pkg4$, '') where slug = 'what-causes-blackheads';

-- winter-dry-skin-barrier-repair-routine
update public.articles set content = replace(content, $pkg4$Editorial Note: This article is educational and does not replace an individualized dermatological diagnosis or treatment plan.$pkg4$, '') where slug = 'winter-dry-skin-barrier-repair-routine';
update public.articles set content = replace(content, $pkg4$Affiliate Disclosure: This article contains affiliate links. As an Amazon Associate and Stylevana partner, BeautyNestKorea earns from qualifying purchases at no additional cost to you.$pkg4$, '') where slug = 'winter-dry-skin-barrier-repair-routine';

-- la-roche-posay-effaclar-a-z-gel-cream-review
update public.articles set content = replace(content, $pkg4$**Affiliate Disclosure:** This article contains affiliate links. As an Amazon Associate and Stylevana partner, BeautyNestKorea earns from qualifying purchases at no additional cost to you.$pkg4$, '') where slug = 'la-roche-posay-effaclar-a-z-gel-cream-review';
update public.articles set content = replace(content, $pkg4$**Medical Disclaimer:** This article is for educational purposes only and does not replace professional medical advice, diagnosis, or treatment. Product formulations may vary by country. Always check the ingredient list and directions on your product packaging.$pkg4$, '') where slug = 'la-roche-posay-effaclar-a-z-gel-cream-review';
update public.articles set content = replace(content, $pkg4$Prices and ratings at all retailers are subject to change at any time; please visit each retailer's website for the most up-to-date information. We may earn a commission at no additional cost to you.$pkg4$, '') where slug = 'la-roche-posay-effaclar-a-z-gel-cream-review';

-- Collapse the blank-line runs left behind by the removals (only on the
-- rows edited above, so untouched article formatting stays byte-identical).
update public.articles
set content = regexp_replace(content, E'(\\r?\\n){4,}', E'\n\n', 'g')
where slug in (
  'how-to-use-celimax-retinal-shot-without-irritation',
  'winter-skin-rescue-restore-skin-barrier',
  'cerave-vs-cetaphil-vs-neutrogena-best-drugstore-moisturizer',
  'chemical-vs-mineral-vs-hybrid-sunscreen',
  'fall-skincare-routine',
  'acne-reset-treatment-plan',
  'korean-skincare-routine-oily-acne-prone-skin',
  'what-causes-blackheads',
  'winter-dry-skin-barrier-repair-routine',
  'la-roche-posay-effaclar-a-z-gel-cream-review'
);

commit;

-- Verify: every count must be 0.
-- how-to-use-celimax-retinal-shot-without-irritation
-- select   position('> Our picks are cosmetic product recommendations, not medical prescriptions. Prices and ratings as of November 10, 2026 · These may change at any time; please check the respective store for the most up-to-date information.' in content) = 0 from public.articles where slug = 'how-to-use-celimax-retinal-shot-without-irritation';
-- winter-skin-rescue-restore-skin-barrier
-- select   position('> **Our picks are cosmetic product recommendations, not medical prescriptions.** Some links are affiliate links — we may earn a commission at no extra cost to you. Educational only — cosmetic guidance and product curation, not medical advice.' in content) = 0 from public.articles where slug = 'winter-skin-rescue-restore-skin-barrier';
-- cerave-vs-cetaphil-vs-neutrogena-best-drugstore-moisturizer
-- select   position('> **Our picks are cosmetic product recommendations, not medical prescriptions.** Some links are affiliate links — we may earn a commission at no extra cost to you.' in content) = 0,   position('> Educational only — cosmetic guidance and product curation, not medical advice. Patch-test new products and see a dermatologist for persistent issues.' in content) = 0 from public.articles where slug = 'cerave-vs-cetaphil-vs-neutrogena-best-drugstore-moisturizer';
-- chemical-vs-mineral-vs-hybrid-sunscreen
-- select   position('*BeautyNestKorea is an editorial site: product links may be affiliate links, which do not affect our recommendations. This article is educational and is not medical advice.*' in content) = 0 from public.articles where slug = 'chemical-vs-mineral-vs-hybrid-sunscreen';
-- fall-skincare-routine
-- select   position('*This article is educational and is not medical advice.*' in content) = 0 from public.articles where slug = 'fall-skincare-routine';
-- acne-reset-treatment-plan
-- select   position('Some links are affiliate links—we may earn a commission at no extra cost to you.' in content) = 0,   position('*Editorial note: This article is educational and does not replace diagnosis. If acne is painful, scarring, or persistent, see a clinician.*' in content) = 0 from public.articles where slug = 'acne-reset-treatment-plan';
-- korean-skincare-routine-oily-acne-prone-skin
-- select   position('*This article provides general skincare education and is not a substitute for medical advice.*' in content) = 0 from public.articles where slug = 'korean-skincare-routine-oily-acne-prone-skin';
-- what-causes-blackheads
-- select   position('**Disclosure: This article contains affiliate links. As an Amazon Associate and Stylevana partner, BeautyNestKorea earns from qualifying purchases at no additional cost to you.**' in content) = 0 from public.articles where slug = 'what-causes-blackheads';
-- winter-dry-skin-barrier-repair-routine
-- select   position('Editorial Note: This article is educational and does not replace an individualized dermatological diagnosis or treatment plan.' in content) = 0,   position('Affiliate Disclosure: This article contains affiliate links. As an Amazon Associate and Stylevana partner, BeautyNestKorea earns from qualifying purchases at no additional cost to you.' in content) = 0 from public.articles where slug = 'winter-dry-skin-barrier-repair-routine';
-- la-roche-posay-effaclar-a-z-gel-cream-review
-- select   position('**Affiliate Disclosure:** This article contains affiliate links. As an Amazon Associate and Stylevana partner, BeautyNestKorea earns from qualifying purchases at no additional cost to you.' in content) = 0,   position('**Medical Disclaimer:** This article is for educational purposes only and does not replace professional medical advice, diagnosis, or treatment. Product formulations may vary by country. Always check the ingredient list and directions on your product packaging.' in content) = 0,   position('Prices and ratings at all retailers are subject to change at any time; please visit each retailer''s website for the most up-to-date information. We may earn a commission at no additional cost to you.' in content) = 0 from public.articles where slug = 'la-roche-posay-effaclar-a-z-gel-cream-review';
