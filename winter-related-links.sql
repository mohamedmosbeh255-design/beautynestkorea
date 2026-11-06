-- One-off internal-link insertion for:
-- /articles/winter-dry-skin-barrier-repair-routine
--
-- Adds exactly 6 standalone paragraphs. Existing text, headings, tables,
-- references, and formatting are preserved byte-for-byte.
-- Safe to run more than once: it exits if the first inserted block already exists.
-- Run in Supabase Dashboard -> SQL Editor.

begin;

do $do$
declare
  v_id uuid;
  v_content text;
  v_updated text;
  v_anchor text;
  v_para text;
  v_target text;
  v_count bigint;
  v_i int;
  v_marker text := $m$> **Related reading:** If you have ever felt that tight$m$;
  v_anchors text[] := array[
    $a1$This guide explains why winter dryness happens, how to choose the right ingredients, and how to build a simple routine based on skin-barrier science.$a1$,
    $a2$However, not every ceramide product is identical. The overall formulation, concentration, and other ingredients matter.$a2$,
    E'4\tUse broad-spectrum SPF 30+\tProtect against UV exposure',
    $a4$Avoid assuming that every oily skin type needs aggressive cleansing or oil-free products.$a4$,
    $a5$However, if you develop significant dryness, burning, or irritation, consider reducing frequency and prioritizing gentle cleansing and moisturizer. Seek professional advice if symptoms persist.$a5$,
    $a6$The winter skincare principle is simple: protect your skin barrier, maintain hydration, and avoid unnecessary irritation.$a6$
  ];
  v_paras text[] := array[
    $p1$> **Related reading:** If you have ever felt that tight, "squeaky" skin is a sign of a healthy clean, you are not alone. Learn why that belief is a myth and how to tell the difference between clean skin and a damaged barrier in our guide: [Barrier Repair Myths Going Viral: Why Tight Skin Isn't Healthy Skin](/articles/barrier-repair-myths-going-viral).$p1$,
    $p2$> **Product comparison:** If you are unsure which moisturizer to choose, we compared three of the most popular drugstore options head-to-head: [CeraVe vs Cetaphil vs Neutrogena: Which Drugstore Moisturizer Is Best? (2026 Dermatologist Review)](/articles/cerave-vs-cetaphil-vs-neutrogena-best-drugstore-moisturizer).$p2$,
    $p3$> **Sunscreen choice matters:** Not all sunscreens work the same way. If you are trying to decide between chemical, mineral, or hybrid formulas, read our breakdown: [Chemical vs Mineral vs Hybrid Sunscreen: How to Choose](/articles/chemical-vs-mineral-vs-hybrid-sunscreen).$p3$,
    $p4$> **More on oily skin routines:** If you have oily skin that still feels dry, our guide to [Korean Skincare Routine for Oily, Acne-Prone Skin](/articles/korean-skincare-routine-oily-acne-prone-skin) explains how to balance oil production without stripping the barrier.$p4$,
    $p5$> **Retinol irritation guide:** If you are using a retinol and experiencing irritation alongside winter dryness, learn how to use [Celimax Vita-A Shot Without Irritation for Sensitive Skin](/articles/how-to-use-celimax-retinal-shot-without-irritation) safely alongside your barrier-supporting moisturizer.$p5$,
    $p6$> **Seasonal transition:** This routine is designed for winter, but your skin will change as the seasons do. For the next seasonal adjustments and what to change in your routine as the weather shifts, see our [Fall Skincare Routine: 5 Changes to Make This October](/articles/fall-skincare-routine).$p6$
  ];
begin
  select id, content
    into v_id, v_content
  from public.articles
  where slug = 'winter-dry-skin-barrier-repair-routine'
  for update;

  if v_id is null then
    raise exception 'Article winter-dry-skin-barrier-repair-routine not found';
  end if;

  if position(v_marker in v_content) > 0 then
    raise notice 'Already applied - no changes made.';
    return;
  end if;

  v_updated := v_content;

  for v_i in 1..array_length(v_anchors, 1) loop
    v_anchor := v_anchors[v_i];
    v_para := v_paras[v_i];
    v_target := v_anchor || E'\r\n\r\n';

    v_count := (length(v_updated) - length(replace(v_updated, v_target, ''))) / length(v_target);
    if v_count <> 1 then
      raise exception 'Link %: expected exactly 1 occurrence of its anchor, found %', v_i, v_count;
    end if;

    v_updated := replace(v_updated, v_target, v_target || v_para || E'\r\n\r\n');
  end loop;

  update public.articles
     set content = v_updated
   where id = v_id;

  raise notice 'Inserted 6 paragraphs. Content length: % -> %', length(v_content), length(v_updated);
end
$do$;

commit;
