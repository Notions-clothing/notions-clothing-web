async function testCSS() {
  const cssRes = await fetch('http://localhost:3000/_next/static/chunks/%5Broot-of-the-server%5D__0ver6b07-fzqk._.css');
  console.log('CSS Status:', cssRes.status);
  const css = await cssRes.text();
  console.log('CSS Length:', css.length);
  console.log('Has .relative:', css.includes('.relative'));
  console.log('Has .flex:', css.includes('.flex'));
  console.log('Has .bg-white:', css.includes('.bg-white'));
  console.log('Has font-serif:', css.includes('.font-serif'));
  console.log('Has #FAF9F5:', css.includes('#FAF9F5'));
}
testCSS();
