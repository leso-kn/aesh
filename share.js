let crypto = require('crypto');
const { createReadStream, createWriteStream, unlinkSync } = require('fs');
const { basename } = require('path');
const { Base64Encode } = require('base64-stream');
const { execSync } = require('child_process');
const qrcode = require('qrcode-terminal');

//

console.log('encryping contents..');

// Any other mime-type will be offered for downloading
const previewTypes = [
  /^image\//,
  /^video\//,
  /^audio\//,
  /^text\//,
  /^application\/pdf/
];

// Mapping between known file extensions and mime-types.
// Used when mime-type cannot be determined using identify-stream
const fileExts = [
  [/\.iso$/, 'application/x-cd-image'],
  [/\.html?$/, 'text/html']
];

//

let inputFilename = process.argv[2];

let file = createReadStream(inputFilename);
let identify = new (require('identify-stream'));

file.pipe(identify);

identify.on('complete', (streamType) =>
{
  let mime = streamType
           ? streamType.mime
           : (fileExts.filter(ext => mime.match(ext[0]))[0] || [0,'text/plain'])[1];

  let usePreview = previewTypes.filter(pt => mime.match(pt)).length > 0;
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

    setTimeout(() => { s.setAttribute('ready', ''); s.innerHTML = 'ready.</br></br>If your browser does not display the document automatically, you can try to launch the download manually using <a href="' + blobURL + '"${usePreview ? '' : ' download="' + basename(inputFilename).split('"').join('') + '"'}>this link</a>.'; }, 1000);
    ${usePreview
      ? 'document.location = blobURL;'
      : `let a = document.createElement('a');
    a.href = blobURL;
    a.download = decodeURIComponent('${encodeURIComponent(basename(inputFilename))}');
    a.click();`}
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
