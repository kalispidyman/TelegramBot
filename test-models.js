async function run() {
  const res = await fetch('https://api.bluesminds.com/models');
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Is HTML?', text.startsWith('<!doctype html>'));
}
run();
