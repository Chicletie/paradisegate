import { Fragment } from "react";
import { fieldValue, RenderMarkdown, SpoilerBlock } from "../lib/markdown";
import type { WikiField } from "../types";
import { SwapBody, SwapCell } from "./EntryActions";
import { RestritoBlocks, RestritoRows } from "./RestritoPlace";
import { useRestritoCount } from "../lib/restritoPlace";

/**
 * Porta de buildTaxonomyPanel na wiki original — só pro tipo Criatura: fatos curtos
 * viram tabela (mesmo clima da infobox), campos longos viram blocos de prosa com cathead.
 */
export function TaxonomyPanel({ taxonomy }: { taxonomy: WikiField[] }) {
  const short = taxonomy.filter((f) => f.type !== "nota");
  const long = taxonomy.filter((f) => f.type === "nota");
  const nR = useRestritoCount("tax-ficha");
  return (
    <div className="article">
      {(short.length > 0 || nR > 0) && (
        <table className="infobox-facts">
          <tbody>
            {short.map((f, i) => (
              <Fragment key={i}>
              <RestritoRows area="tax-ficha" index={i} />
              {f.type === "cabecalho" ? (
                <tr key={i} className="infobox-header-row">
                  <th colSpan={2}>{f.key}</th>
                </tr>
              ) : (
                <tr key={i}>
                  <th>
                    {f.key}
                  </th>
                  <SwapCell slot={"ts:" + i} fieldKey={"tax:" + f.key}>
                    {f.vis === "spoiler" ? (
                      <SpoilerBlock>
                        <span>{fieldValue(f.value)}</span>
                      </SpoilerBlock>
                    ) : (
                      fieldValue(f.value)
                    )}
                  </SwapCell>
                </tr>
              )}
              </Fragment>
            ))}
            <RestritoRows area="tax-ficha" index={short.length} />
          </tbody>
        </table>
      )}
      {long.map((f, i) => (
        <Fragment key={i}>
          <RestritoBlocks area="tax-notas" index={i} />
          <h2 className="cathead">
            {f.key}
          </h2>
          <SwapBody slot={"tl:" + i} fieldKey={"tax:" + f.key}>
            {f.vis === "spoiler" ? (
              <SpoilerBlock>
                <RenderMarkdown text={f.value} />
              </SpoilerBlock>
            ) : (
              <RenderMarkdown text={f.value} />
            )}
          </SwapBody>
        </Fragment>
      ))}
      <RestritoBlocks area="tax-notas" index={long.length} />
    </div>
  );
}
