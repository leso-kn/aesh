let crypto = require('crypto');
const { createReadStream, createWriteStream, unlinkSync } = require('fs');
const { Base64Encode } = require('base64-stream');
const { execSync } = require('child_process');
const qrcode = require('qrcode-terminal');

//

console.log('encryping contents..');

let file = createReadStream(process.argv[2]);
let identify = new (require('identify-stream'));

file.pipe(identify);

identify.on('complete', (streamType) =>
{
  let mime = streamType ? streamType.mime : 'text/plain';

  let output = createWriteStream('.enc.htm');

  output.write(`<!DOCTYPE html>
<meta name="viewport" content="width=device-width, initial-scale=1">
Status: <span id=s>downloading file..</span>
<style>
  #s:not([ready]):after { content: ""; display: inline-block; width: .7em; height: .7em; border: .15em solid #68999f; animation: 2s spin linear infinite; margin-left: .3em; }
  #s[error]:after { animation: none; border-color: #a24 !important; }
  @keyframes spin { 0% { transform: rotate(0) } 100% { transform: rotate(360deg) }}
</style>
<script>
var _key = document.location.hash.substring(1);
document.location.hash = '';
</script>
<script id="content">
let mimetype = '${mime}';
let enc = '`);

  let key = crypto.randomBytes(32);
  let iv = crypto.randomBytes(16);

  let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  identify.pipe(cipher).pipe(new Base64Encode()).pipe(output, { end: false }).on('unpipe', () =>
  {
    output.write(`';

//

let iv = '${iv.toString('base64')}';
window.onload = async function()
{
  try
  {
    let key = _key;
    _key = null;

    s.innerText = 'decrypting contents..';

    key = await crypto.subtle.importKey('raw', Uint8Array.from(atob(key), c => c.charCodeAt(0)), { name: 'AES-CBC' }, false, ['decrypt']);

    let blobURL = window.URL.createObjectURL(new Blob([
      await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0)) }, key, Uint8Array.from(atob(enc), c => c.charCodeAt(0)))], { type: mimetype }));

    setTimeout(() => { s.setAttribute('ready', ''); s.innerHTML = 'ready.</br></br>If your browser does not display the document automatically, you can try to launch the download manually using <a href="' + blobURL + '">this link</a>.'; }, 1000);
    document.location = blobURL;
  }
  catch (err)
  { s.innerText = 'Error: ' + err.toString(); s.setAttribute('error', ''); content.parentNode.removeChild(content); }
}
</script>
`, (err) =>
    {
      // Done
      output.close(() =>
      {
        console.log('uploading file..');
        let ret = execSync('ipfs add .enc.htm').toString();

        if (ret.startsWith('added '))
        {
          // Success
          let hash = ret.split(' ')[1];

          let shareLink = `https://ipfs.io/ipfs/${hash}#${key.toString('base64')}`;
          qrcode.generate(shareLink, { small: true }, (qrc) =>
          {
            console.log(qrc);
            console.log('Share available at: ' + shareLink + '\n');
          });
          execSync('ipfs pin add ' + hash);
          unlinkSync('.enc.htm');
        }
        else
        {
          console.log(ret);
        }
      });
    });
  });
});
