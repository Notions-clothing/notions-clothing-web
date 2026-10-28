async function check() {
  const res = await fetch('http://localhost:3000/');
  const html = await res.text();
  console.log('Status:', res.status);
  const links = html.match(/<link[^>]*rel="stylesheet"[^>]*>/g);
  console.log('Stylesheets in HTML:', links);
}
check();
