// 统一打包入口：deno task pack
// 依次调用 @funxdata/toolkit/pack，生成 info / design / base.css 产物
const entries = ["src/info.ts", "assets/css/base.css"];

for (const entry of entries) {
  console.log(`\n==> pack ${entry}`);
  const cmd = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-run",
      "--allow-env",
      "--allow-ffi",
      "--allow-sys",
      "--allow-write",
      "jsr:@funxdata/toolkit/pack",
      entry,
    ],
    cwd: Deno.cwd(),
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = await cmd.output();
  if (code !== 0) {
    console.error(`pack failed: ${entry}`);
    Deno.exit(code);
  }
}
console.log("\n✅ setting pack 完成");
