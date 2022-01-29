/*
 * aesh - Lesosoftware 2022
 */

let crypto = require('crypto');
const { createReadStream, createWriteStream, unlinkSync, readFileSync } = require('fs');
const { basename, join } = require('path');
const { Base64Encode } = require('base64-stream');
const { execSync } = require('child_process');
const minify = require('@minify-html/js');
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

async function command_add(filename)
{
    let file = createReadStream(filename);
    let identify = new (require('identify-stream'));

    file.pipe(identify);
    let streamType = await new Promise(r => identify.on('complete', r));

    let mime = streamType
            ? streamType.mime
            : (fileExts.filter(ext => mime.match(ext[0]))[0] || [0,'text/plain'])[1];

    let usePreview = previewTypes.filter(pt => mime.match(pt)).length > 0; // used in template.htm
    //

    let output = createWriteStream('.enc.htm');
    let template = readFileSync(join(__dirname, 'template.htm')).split('{{contents}}');

    //
    output.write(minify.minify(eval(`\`${template[0]}\``)));

    let key = crypto.randomBytes(32);
    let iv = crypto.randomBytes(16);

    let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    // Encrypt file contents
    await new Promise(r => identify.pipe(cipher)
                                   .pipe(new Base64Encode())
                                   .pipe(output, { end: false })
                                   .on('unpipe', r));

    iv = iv.toString('base64');

    //
    await new Promise(r => output.write(minify.minify(eval(`\`${template[1]}\``)), r));
    await new Promise(r => output.close(r));

    // Upload constructed html file to IPFS
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
    else { /* Error */ console.log(ret); }
};

command_add(process.argv[2]);
