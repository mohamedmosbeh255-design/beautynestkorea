/**
 * Local ESLint rule: every literal affiliate-domain link (amazon.com,
 * oliveyoung.com) in JSX must carry target="_blank" and
 * rel="nofollow sponsored noopener".
 *
 * Dynamic hrefs (AffiliateButtons, markdown renderers) are centralized in
 * src/lib/affiliates.ts `isAffiliateDomainLink` and fixed at the component
 * level; this rule guards all literal hrefs so regressions fail `npm run lint`.
 */
export const affiliateLinkAttrs = {
  meta: {
    type: "problem",
    docs: {
      description: "Require target + sponsored rel on affiliate-domain links",
    },
    schema: [],
  },
  create(context) {
    const AFFILIATE_RE = /amazon\.com|oliveyoung\.com/i;
    return {
      JSXElement(node) {
        const opening = node.openingElement;
        if (opening.name?.type !== "JSXIdentifier" || opening.name.name !== "a") return;
        let href = null;
        let rel = null;
        let target = null;
        for (const attr of opening.attributes) {
          if (attr.type !== "JSXAttribute" || attr.name.type !== "JSXIdentifier") continue;
          if (attr.value?.type === "Literal" && typeof attr.value.value === "string") {
            if (attr.name.name === "href") href = attr.value.value;
            if (attr.name.name === "rel") rel = attr.value.value;
            if (attr.name.name === "target") target = attr.value.value;
          }
        }
        if (typeof href !== "string" || !AFFILIATE_RE.test(href)) return;
        const tokens = new Set((rel ?? "").toLowerCase().split(/\s+/).filter(Boolean));
        const missing = ["nofollow", "sponsored", "noopener"].filter((t) => !tokens.has(t));
        if (target !== "_blank" || missing.length > 0) {
          context.report({
            node: opening,
            message:
              "Affiliate link to {{href}} must use target=\"_blank\" and rel=\"nofollow sponsored noopener\"{{detail}}.",
            data: {
              href,
              detail:
                target !== "_blank"
                  ? " (target is missing or not _blank)"
                  : ` (rel is missing: ${missing.join(", ")})`,
            },
          });
        }
      },
    };
  },
};

const affiliateLinksPlugin = { rules: { "affiliate-link-attrs": affiliateLinkAttrs } };

export default affiliateLinksPlugin;
