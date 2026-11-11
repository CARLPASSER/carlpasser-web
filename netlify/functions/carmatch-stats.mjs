// CAR MATCH の集計を返す。Netlifyの環境変数 CARMATCH_STATS_KEY と同じ合言葉のときだけ見られる。
import { getStore } from "@netlify/blobs";

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

export default async (req) => {
  const secret = Netlify.env.get("CARMATCH_STATS_KEY");
  if (!secret) return json(503, { message: "CARMATCH_STATS_KEY が未設定です" });
  if (req.headers.get("x-stats-key") !== secret) return json(401, { message: "合言葉がちがいます" });

  const store = getStore("carmatch");
  const tally = {};
  for (const prefix of ["start/", "done/"]) {
    const { blobs } = await store.list({ prefix });
    for (const { key } of blobs) {
      const k = key.split("/").slice(0, -1).join("/"); // 末尾のIDを外して同じ中身ごとに数える
      tally[k] = (tally[k] || 0) + 1;
    }
  }
  // rows: [種類, 日付, タイプ, もうひとつの顔, 暮らしの条件, 件数]
  const rows = Object.entries(tally).map(([k, n]) => [...k.split("/"), n]);
  return json(200, { rows });
};
