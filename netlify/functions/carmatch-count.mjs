// CAR MATCH の集計：診断の開始と結果を1件ずつ記録する（個人情報・Cookieは使わない）
// 記録するのは「日付・タイプ・もうひとつの顔・暮らしの条件」だけ。中身はキー名に入れ、値は空。
import { getStore } from "@netlify/blobs";

const TYPES = ["wander", "family", "style", "gear", "vintage", "city", "smart", "cruise"];
const SUBS = ["NEO", "SPORT", "KEI", ...TYPES];
const NEEDS = ["FAMILY", "GEAR", "CITY", "FREE"];

export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  let b;
  try { b = await req.json(); } catch { return new Response("Bad Request", { status: 400 }); }

  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // 日本時間の日付
  const id = crypto.randomUUID();
  let key;
  if (b.e === "start") key = `start/${day}/${id}`;
  else if (b.e === "done" && TYPES.includes(b.type) && SUBS.includes(b.sub) && NEEDS.includes(b.need))
    key = `done/${day}/${b.type}/${b.sub}/${b.need}/${id}`;
  else return new Response("Bad Request", { status: 400 });

  await getStore("carmatch").set(key, "1");
  return new Response(null, { status: 204 });
};
