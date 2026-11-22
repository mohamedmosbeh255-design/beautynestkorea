-- Package 2 — content cleanup (prices + therapeutic claims).
-- 19 unique rows: 14 descriptions with hardcoded $ prices, 7 with therapeutic
-- claims, with first-aid-beauty and bioderma appearing in both lists.
-- Prices live ONLY in the verified price/price_checked_at columns after this.
-- Run in Supabase SQL Editor; each statement is independent and idempotent.

-- 1) first-aid-beauty-ultra-repair-cream (prices + claims)
update public.products set description = $desc$An award-winning, head-to-toe rescue moisturizer designed to comfort dry, distressed-looking skin. Formulated with colloidal oatmeal, shea butter, and ceramides, this rich yet fast-absorbing whipped cream helps calm the look of redness, supports the skin's moisture barrier, and provides long-lasting hydration without feeling greasy.

Formulated for sensitive skin, it is a winter barrier staple against harsh winds, chapping, and indoor-heating dryness.

• Available sizes: 2 oz tube, 4 oz jar, and 6 oz value tub.
• Key concerns: dryness, rough patches, winter chapping, and barrier support.
• Texture: Luxurious, velvety whipped cream that melts into the skin.
• How to use: Apply to face and body twice daily, or whenever skin feels dry, tight, or uncomfortable.$desc$
where slug = 'first-aid-beauty-ultra-repair-cream';

-- 2) numbuzin-no5-dark-spot-serum
update public.products set description = $desc$⚠️ IMPORTANT: Choose the Right Formula for Your Skin
Although both products share the same name and goal (brightening the look of dark spots), they feature different active formulations:
🟡 Option 1: Olive Young Version (Duo Set - 60 ml)
• Key Actives: Glutathione + Vitamin C.
• How it works: Brightening antioxidants for a more even, radiant look.
• Best for: Overall tone unification, surface-level spot care, and value (2 bottles in one set).
Option 2: Amazon Version (Single Bottle - 30 ml)
• Key Actives: Tranexamic Acid 4% + Niacinamide 5%.
• How it works: Targets the look of stubborn-looking pigmentation and post-blemish marks.
• Best for: Deep-looking pigmentation, persistent post-acne marks, and concentrated spot care.
Verdict: Both are authentic and effective. If your priority is overall brightening and glow, choose Olive Young. If your priority is targeted care for stubborn-looking pigmentation, choose the Amazon version.
→ Check the current price and any promotion on each retailer page before buying.$desc$
where slug = 'numbuzin-no5-dark-spot-serum';

-- 3) celimax-vita-a-retinal-shot-tightening-booster
update public.products set description = $desc$celimax The Vita A Retinal Shot Tightening Booster combines 0.1% Retinal with 3% Matrixyl for pore firming and a tighter-looking complexion, from pores to neck lines. Available in a 15ml bottle on Amazon and a 15ml + 3ml bonus set (18ml total, Olive Young-exclusive). Check each retailer page for the current price and size before buying.$desc$
where slug = 'celimax-vita-a-retinal-shot-tightening-booster';

-- 4) aestura-atobarrier365-cream-comparison
update public.products set description = $desc$AESTURA Atobarrier365 Cream (80ml) is the same product on both platforms, built around Ceramide and DermaON barrier technology. What differs is what's included with it. Amazon offers the cream on its own (80ml). Olive Young offers the cream (80ml) plus a Capsule Toner (25ml), Cleanser (3g×3), bonus Ampoule (7ml) and Essence (25ml). The price difference reflects the additional products in the Olive Young set, not a markup on the same item. Which is the better value depends on what you need: the cream alone, or a full routine to try. Check each retailer page for the current price before buying.$desc$
where slug = 'aestura-atobarrier365-cream-comparison';

-- 5) eltamd-uv-daily-broad-spectrum-spf-40
update public.products set description = $desc$THE DAILY DEFENSE FOR SENSITIVE SKIN:
EltaMD UV Daily is a lightweight daily sunscreen formulated with 9% transparent zinc oxide for broad-spectrum protection against UVA and UVB rays without leaving a white cast.

WHY IT STANDS OUT FOR SENSITIVE & DRY SKIN:
Unlike pure mineral sunscreens that can feel heavy or leave a cast, this hybrid zinc oxide + octinoxate formula spreads gently on the surface. Enriched with Hyaluronic Acid, it helps support moisture retention and comfort dry, dehydrated-looking skin. The lightweight, moisturizing formula absorbs quickly, making it a great primer under makeup or a standalone moisturizer for daily wear.

BUYING NOTES:
• Single-unit purchases from major US retailers such as Amazon offer fast domestic shipping and easy returns.
• Tinted vs. untinted: this listing shows the untinted (clear finish) version, ideal for all skin tones; tinted versions offer a subtle evening of skin tone.

VERDICT:
For a no-nonsense daily sunscreen that hydrates while it protects, EltaMD UV Daily is a fragrance-free, paraben-free, non-comedogenic option. Prices may change at any time across all retailers. A product available on one retailer may not be available on another — always check the retailer site before purchasing.$desc$
where slug = 'eltamd-uv-daily-broad-spectrum-spf-40';

-- 6) laneige-cream-skin-cerapeptide-toner
update public.products set description = $desc$The iconic, award-winning Korean 2-in-1 milky toner and moisturizer that revolutionized winter skincare. Powered by Laneige's patented Micro-Blending Technology, a jar of deeply nourishing cream is dissolved into a refreshing, fast-absorbing liquid toner to deliver 8x immediate hydration and up to 120 hours of moisture retention.

Enriched with the proprietary Cerapeptide™ complex (combining ceramides and peptides) along with amino-acid-rich white leaf tea extract, it reinforces the skin's moisture barrier, boosts elasticity, and helps comfort cold-weather dryness and tightness.

• Available sizes on Amazon: 5 fl oz bottle, 5.7 fl oz refill pouch, and 10.8 fl oz jumbo bottle.
• Skin feel: Milky, comforting texture that absorbs instantly without tackiness.
• Who it's for: Ideal for dry, sensitive, normal, and combination skin needing barrier support.
• How to use: In the morning and evening, dispense an appropriate amount into palms and gently pat onto the face and neck until absorbed. For intense winter hydration, apply 2 to 3 layers.$desc$
where slug = 'laneige-cream-skin-cerapeptide-toner';

-- 7) dalba-white-truffle-first-spray-serum
update public.products set description = $desc$The globally acclaimed Korean "Flight Attendant Mist" has sold over 70 million bottles worldwide. D'Alba Piedmont First Spray Serum features an innovative bi-phase formula combining an ultra-hydrating serum base with a nutrient-dense botanical oil layer to provide immediate glass-skin radiance, deep 120-hour moisture retention, and antioxidant protection without disturbing makeup.

Infused with premium Italian white truffles (Tuber Magnatum) and vitamin E to form d'Alba's patented Trufferol™ complex, this all-in-one spray functions as a prep toner, hydrating serum, and dewy setting mist.

• Available variants on Amazon:
  1. Classic First Spray Serum (3.38 fl oz / 1.69 fl oz): The signature all-in-one hydrating glow formula.
  2. Refresh Aqua Serum (3.38 fl oz): Lightweight, calming hydration for oily and combo skin.
  3. Vital Spray Serum (3.38 fl oz): Soothing rose-infused care for sensitive and redness-prone skin.
  4. First Spray Serum Pro 2X Peptide (3.38 fl oz): For a firmer-looking, more elastic look.

• How to use: Shake well 3 to 5 times to thoroughly blend the oil and serum layers. Close eyes and mist 4–5 times from 8–10 inches away from the face. Pat gently to absorb. Safe to use before or over makeup throughout the day.
• Certified Vegan (Italian V-Label) & Non-comedogenic.$desc$
where slug = 'dalba-white-truffle-first-spray-serum';

-- 8) round-lab-birch-juice-moisturizing-sunscreen
update public.products set description = $desc$ROUND LAB Birch Juice Moisturizing Sunscreen SPF45 uses birch tree sap (Betula Platyphylla Japonica Juice) to hydrate while protecting, with a lightweight, no-white-cast finish suitable for sensitive skin. Note: the Amazon "UV Lock" version is specially reformulated to meet US FDA OTC sunscreen regulations, so its exact UV filter blend differs slightly from the original Korean formula sold on Olive Young — both share the same hydrating, ultra-lightweight experience the line is known for. Amazon offers a 2-tube pack; Olive Young offers a 3-tube pack. Olive Young's pack has a lower per-tube cost, while Amazon includes US-compliant SPF testing and faster shipping. Check each retailer page for the current price before buying.$desc$
where slug = 'round-lab-birch-juice-moisturizing-sunscreen';

-- 9) medicube-capsule-cream-collection-5-formulas
update public.products set description = $desc$Medicube Capsule Cream Collection—five targeted formulas in one family, each blending active capsules into a lightweight gel-cream. 1) TXA Niacinamide (Tranexamic Acid + 5% Niacinamide) for dark spots, post-acne marks & uneven tone. 2) Deep Vita C (Vitamin C Derivatives + 5% Niacinamide) for radiance, rough texture & dullness. 3) PDRN Pink Collagen (Salmon DNA + Collagen) for plumping, elasticity & fine lines. 4) Kojic Acid Turmeric Vita for hyperpigmentation, sun spots & brightening. 5) Hyaluronic moisturizing for deep hydration & dry winter skin. Ceramides, panthenol, and hyaluronic acid soothe and strengthen the barrier across all formulas—gentle enough for sensitive, acne-prone skin. 55 g / 1.94 oz each. Amazon's Choice.$desc$
where slug = 'medicube-capsule-cream-collection-5-formulas';

-- 10) bioderma-sensibio-h2o-micellar-water-original (prices + claims)
update public.products set description = $desc$Note: You may receive either the classic packaging or the updated eco-design bottle. The formula remains identical.
A GENTLE STAPLE FOR SENSITIVE SKIN:
Bioderma Sensibio H2O is a foundational step in gentle skincare routines worldwide. Utilizing exclusive micellar technology, its solution acts as a magnet to attract and dissolve dirt, excess sebum, sunscreen, and waterproof makeup without rubbing or rinsing. The pH-balanced, fragrance-free formula respects the skin's natural barrier and is formulated for reactive, redness-prone skin.

WHY IT IS A STAPLE IN K-BEAUTY REGIMENS:
While originating from French pharmacy heritage, Bioderma has become integral to Korean double-cleansing methods. It serves as the ideal first cleanse to effectively remove heavy sunscreens and impurities before applying treatment essences, ensuring maximum absorption of subsequent products without irritation.

BUYING NOTES:
• Single 500ml bottles via major US retailers such as Amazon are ideal for testing the formula or restocking quickly, with fast domestic shipping and easy returns.
• Double sets (2 x 500ml) found on some global K-beauty platforms can offer a better cost-per-ounce ratio for regular users, though cross-border delivery may take longer and bundle availability varies by region.

VERDICT:
Bioderma Sensibio maintains consistent formulation integrity across authorized distribution networks. Always validate product authenticity by inspecting batch codes upon receipt. Prices may change at any time across all retailers. A product available on one retailer may not be available on another — always check the retailer site before purchasing.$desc$
where slug = 'bioderma-sensibio-h2o-micellar-water-original';

-- 11) cosrx-ultimate-nourishing-rice-overnight-spa-mask
update public.products set description = $desc$About this product

68% rice extract leave-on sleeping mask with niacinamide. Apply at night as the last step in your routine, leave on overnight, and wake up with deeply nourished, brighter-looking skin. Designed for dull, dry, and tired-looking skin—it hydrates while you sleep. Paraben-free, cruelty-free, and formulated to be gentle on sensitive skin.
Key ingredients: Rice Extract (68%), Niacinamide
Size: 60ml / 2.02 fl.oz.
Our picks are cosmetic product recommendations, not medical prescriptions. Some links are affiliate links—we may earn a commission at no extra cost to you.$desc$
where slug = 'cosrx-ultimate-nourishing-rice-overnight-spa-mask';

-- 12) skin1004-madagascar-centella-double-cleansing-duo
update public.products set description = $desc$SKIN1004 Madagascar Centella Double Cleansing Duo combines a Light Cleansing Oil (200 ml) and Ampoule Foam (125 ml) for a complete, gentle clean. Infused with 100% Madagascar Centella Asiatica to help soothe the look of redness and support the skin barrier while removing makeup and sunscreen effectively. Ideal for sensitive and acne-prone skin.

✨ KEY BENEFITS:
• Helps soothe the look of redness and irritation.
• Melts waterproof makeup without stripping moisture.
• Fragrance-free and sulfate-free formula.
• Designed for sensitive skin types. Prices may change at any time across all retailers. A product available on one retailer may not be available on another — always check the retailer site before purchasing.$desc$
where slug = 'skin1004-madagascar-centella-double-cleansing-duo';

-- 13) bioheal-boh-probioderm-3d-lifting-cream
update public.products set description = $desc$BIOHEAL BOH Probioderm 3D Lifting Cream combines a 17-peptide complex with Probioderm technology in a butter-rich, slugging-friendly texture for face and neck. Designed for firmer-looking skin and a smoother appearance. ✨ KEY BENEFITS: • Helps skin look firmer and smoother • Butter-rich texture ideal for slugging • 17-peptide complex + Probioderm for barrier support • Best Seller on Amazon with 4K+ purchases in the past month • Winner: Olive Young Awards 2025 (Trend category) Prices may change at any time across all retailers. A product available on one retailer may not be available on another — always check the retailer site before purchasing.$desc$
where slug = 'bioheal-boh-probioderm-3d-lifting-cream';

-- 14) cosrx-the-vitamin-c-23-serum
update public.products set description = $desc$Upgraded version of COSRX's high-strength vitamin C serum: the bottle reads "Advanced The Vitamin C 23" — the same product Amazon lists as "COSRX 23% Pure Vitamin C Serum with Vitamin E, Glutathione" (0.7oz / 20g). At 23% pure vitamin C it may reduce the appearance of dark spots and uneven tone over time and helps improve the look of dullness and early fine lines, while vitamin E and hyaluronic acid keep the high concentration comfortable to wear. Same formula on both retailers, different pack: Amazon ships the single 20g bottle, while Olive Young sells a 2 x 20g duo set — buy the duo only if you will genuinely use two bottles. Best for normal to resilient skin dealing with dullness or post-blemish marks; 23% is a high strength, so patch test and start every other morning. It is an antioxidant serum, not a sunscreen — pair it with broad-spectrum SPF in the morning. Prices may change at any time across all retailers. A product available on one retailer may not be available on another — always check the retailer site before purchasing.$desc$
where slug = 'cosrx-the-vitamin-c-23-serum';

-- 15) differin-acne-treatment-adapalene-gel
update public.products set description = $desc$The gold-standard OTC retinoid available without a doctor's visit. Differin Gel contains 0.1% Adapalene, an over-the-counter retinoid active used to help improve the look of clogged pores, blemishes, and uneven texture.

Formulated to support cellular turnover, this oil-free, water-based gel penetrates into pores to help reduce the look of congestion and post-blemish marks over time.

• Target concerns: blemishes, clogged pores, blackheads, rough texture, and post-blemish dark marks.
• Texture: Clear, ultra-lightweight water-based gel that absorbs rapidly without alcohol or fragrance.
• Who it's for: Oily, combination, and congestion-prone skin.
• How to use: Apply a pea-sized amount once daily at night all over the face (not as a spot treatment). In dry winter months, use the "Sandwich Method": apply a light hydrating toner/moisturizer first, apply Differin Gel, then seal with a rich moisturizer (like Aestura 365 or Cicaplast B5). Always use broad-spectrum SPF in the morning.
• Non-comedogenic and hypoallergenic.$desc$
where slug = 'differin-acne-treatment-adapalene-gel';

-- 16) vaseline-petroleum-jelly-original
update public.products set description = $desc$100% pure petroleum jelly that helps lock in moisture and soften dry, cracked-looking skin. The occlusive barrier helps prevent moisture loss — apply over moisturizer at night or on elbows, knees, feet, and lips. Fragrance-free, non-comedogenic, and formulated for sensitive and baby skin. Prices may change at any time across all retailers. A product available on one retailer may not be available on another — always check the retailer site before purchasing.$desc$
where slug = 'vaseline-petroleum-jelly-original';

-- 17) aquaphor-healing-ointment
update public.products set description = $desc$A rich ointment formulated to comfort dry, severely dry-looking skin. Contains 4% panthenol plus petrolatum, glycerin, and bisabolol to help soothe, protect, and support the skin's moisture barrier. Fragrance-free and non-comedogenic. Use on dry hands, cracked-looking heels, chapped lips, and rough patches. Prices may change at any time across all retailers. A product available on one retailer may not be available on another — always check the retailer site before purchasing.$desc$
where slug = 'aquaphor-healing-ointment';

-- 18) elemis-dynamic-resurfacing-facial-pads
update public.products set description = $desc$A gentle skin-smoothing daily exfoliating pad powered by ELEMIS's patented Tri-Enzyme Technology. Designed as a non-abrasive, skin-friendly alternative to physical scrubs, these dual-textured pads gently sweep away dull, dead skin cells to reveal a more luminous, glass-like complexion.

Enriched with Lactic Acid (AHA) and a Probiotic Ferment Complex, the formula promotes natural cell turnover while respecting the skin's moisture barrier and microbiome, making it an ideal winter exfoliator that helps smooth the look of flaky dryness.

• Results: Helps smooth uneven texture, refine the look of enlarged pores, and diminish the look of dark spots.
• Key ingredients: Patented Tri-Enzyme Technology (Papain, Protease, Subtilisin), Lactic Acid, and Pro-Biotic Ferment Complex.
• How to use: Smooth one pad, textured side down, over the cleansed face and neck in circular motions every morning and evening. Follow with your hydrating serum and moisturizer. Always wear SPF during the day.
• Suitable for all skin types.$desc$
where slug = 'elemis-dynamic-resurfacing-facial-pads';

-- 19) paulas-choice-2-bha-liquid-exfoliant
update public.products set description = $desc$A leave-on exfoliant with 2% salicylic acid (BHA) that penetrates into pores to help dissolve dead skin cells and excess oil. Helps unclog and refine the look of enlarged pores, smooth the look of fine lines, and even skin tone. Lightweight, non-abrasive formula suitable for all skin types. Fragrance-free. #1 Best Seller in Facial Polishes with over 117,000 reviews. Prices may change at any time across all retailers. A product available on one retailer may not be available on another — always check the retailer site before purchasing.$desc$
where slug = 'paulas-choice-2-bha-liquid-exfoliant';

-- Verification: expect 0 rows with hardcoded $ prices in descriptions.
select slug
from public.products
where description ~ '\$\s?[0-9]';

-- Verification: expect 0 rows for the 7 therapeutic-claim products.
select slug
from public.products
where slug in (
  'first-aid-beauty-ultra-repair-cream',
  'differin-acne-treatment-adapalene-gel',
  'vaseline-petroleum-jelly-original',
  'aquaphor-healing-ointment',
  'elemis-dynamic-resurfacing-facial-pads',
  'bioderma-sensibio-h2o-micellar-water-original',
  'paulas-choice-2-bha-liquid-exfoliant'
)
and description ~* 'clinically proven|dermatologist-recommended|eczema|repairs a compromised|stimulates collagen';
