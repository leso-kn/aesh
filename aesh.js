#!/usr/bin/env node
/*
 * aesh - Lesosoftware 2022
 */

let crypto = require('crypto');
const { createReadStream, createWriteStream, unlinkSync, readFileSync } = require('fs');
const { basename, join, resolve, dirname } = require('path');
const { Base64Encode } = require('base64-stream');
const { execSync } = require('child_process');
const minify = require('@minify-html/js');
const qrcode = require('qrcode-terminal');

//

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

function fullpath(filename)
{
    let path = resolve(filename);
    if (path[0] != '/' && path[1] == ':')
    {
        // DOS path
        path = '/' + path[0].toLowerCase() + path.replace(/\\/g, '/').substring(2);
    }
    return path;
}

function print_usage()
{
    console.log(`
Usage: aesh add [-t <mimetype>] [-n <filename>] <file.(txt|pdf|mp3|...)>
            del <local file|mfs path>

            -t, --mime=<mimetype> - explicitly set download / preview mime-type.

            -n, --name=<filename> - customize the download filename and local
                                    mfs (ipfs files) path.`.substring(1));
}

function cliArg(shortName, longName)
{
    // short name
    let arg = process.argv.indexOf('-' + shortName);
    if (arg >= 0)
    { return process.argv.splice(arg, 2)[1]; }

    // long name
    arg = process.argv.findIndex(v => v.startsWith('--' + longName + '='))
    if (arg >= 0)
    { return process.argv.splice(arg, 1)[0].substring(longName.length+3); }

    // not found
    return null;
}

async function command_add()
{
    let mime = cliArg('t', 'mime');
    let overrideFilename = cliArg('n', 'name');

    let filename = process.argv[3];
    if (!filename) { print_usage(); return; }

    //
    console.log('encryping contents..');

    let file = createReadStream(filename);
    let identify = new (require('identify-stream'));
    file.pipe(identify);

    if (!mime)
    {
        let streamType = await new Promise(r => identify.on('complete', r));

        mime = streamType
            ? streamType.mime
            : (fileExts.filter(ext => filename.match(ext[0]))[0] || [0,'text/plain;charset=utf-8'])[1];
    }

    let usePreview = previewTypes.filter(pt => mime.match(pt)).length > 0; // used in template.htm
    //

    let output = createWriteStream('.enc.htm');
    let template = readFileSync(join(__dirname, 'template.htm')).toString().split('{{content}}');

    let minifyCfg = minify.createConfiguration({ minify_css: true, do_not_minify_doctype: true });

    filename = overrideFilename || filename;

    //
    output.write(minify.minify(eval(`\`${template[0]}\``), minifyCfg));

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
    await new Promise(r => output.write(minify.minify(eval(`\`${template[1]}\``), minifyCfg).toString()
                                              .replace(/\<script\>$/, '</script>'), r)); // Fix minification issue
    await new Promise(r => output.close(r));

    // Upload constructed html file to IPFS
    console.log('uploading file..');
    let ret = execSync('ipfs add --pin=false .enc.htm').toString();

    if (ret.startsWith('added '))
    {
        // Success
        let hash = ret.split(' ')[1];
        let shareLink = `https://ipfs.io/ipfs/${hash}#${key.toString('base64')}`;

        qrcode.generate(shareLink, { small: true }, (qrc) =>
        {
            console.log('\n' + qrc);
            console.log('Share available at: ' + shareLink + '\n');
        });

        execSync(`ipfs files cp -p /ipfs/${hash} "${fullpath(filename)}"`);
        unlinkSync('.enc.htm');
    }
    else { /* Error */ console.log(ret); }
};

async function command_del()
{
    let filename = process.argv[3];
    if (!filename) { print_usage(); return; }

    execSync(`ipfs files rm -r "${fullpath(filename)}"`);
    console.log(`removed local share (${basename(filename)})`);
}

// Main

let cmd = process.argv[2];

switch (cmd)
{
    case 'add':
    {
        command_add();
        break;
    }
    case 'del':
    {
        command_del();
        break;
    }
    default: print_usage();
}
