# aesh

Encrypt and share files through IPFS via QR codes or NFC tags.

## Requirements

* Nodejs
* IPFS (the `ipfs`-command installed in your `PATH`)

## Usage

```bash
> aesh add <file.(txt|pdf|mp3|...)>
```

The above command will do four things:

1. Encrypt a given (local) file using the `aes-256-cbc` algorithm
2. Add (upload) the encrypted file to your local IPFS
3. Register the file in your local [MFS](https://docs.ipfs.io/concepts/file-systems/#mutable-file-system-mfs) (IPFS) using the same path as on your local filesystem
4. Return a QR code and the plain URL pointing to the file inside IPFS.

   Anyone with the presented link (URL or QR code) can decrypt and view  
   or download the file through any modern web browser.

> **Disclaimer**: Share the qr code / full link with people you trust only! The text behind the hash (#) in the end of the URL is the single and only thing needed to decrypt the uploaded file and should therefor be treated like a password.

## Example

```bash
> aesh add hello-world.txt 

encryping contents..
uploading file..
 1.77 KiB / 1.77 KiB [============] 100.00%
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▄▄▄▄▀█ █▀▀█▄ ▄▄   ▀█▄▀ ▄ █ ▄▄▄▄▄ █
█ █   █ █   ▄▄▄▄▀▄█ ██▀▀██▄▀▄█▀▄▄▀█ █   █ █
█ █▄▄▄█ █▄▀▄▄▄██▀ ▄▄██▀▀█▀ ▄▄▄ ▀▀▀█ █▄▄▄█ █
█▄▄▄▄▄▄▄█▄█ █▄█ ▀ ▀ ▀▄█▄▀▄█ █▄▀▄█ █▄▄▄▄▄▄▄█
█ ▄  ▀▀▄█▄▀▀█▀▀ ▄█ █▀  █▄██    ▄▀  ▀▀  ▄█▄█
█▄ ▀█▄▀▄▄ ▄  ▀▄███▀▄▀██▄▄▄▀ ▀██ ▀███▄██▄ ██
█▀█▄ ▄█▄ █ █▀██ ▄▄██▄ ▀▀█ █ ▄▀▀▀▄▄▀▀▄█  ▀▀█
█  ▄▄▀▀▄▄█  █ ▄ ▀██▀▄▄▀▄▀▀▄▄▀█▄█▄▀  ▄  █ ▄█
██ ▄ ▄▄▄▀▀ █▄▀▀████ █ ▄█ ▀▄█▀ ▀█▄  █▀▄▀█ ▀█
██▀█▀█▀▄█▀▀▀▀███▄▄▀ █▄█▄██▄▄ ▀ ▄▀▄▄▀  ▀▀█▀█
█▄▀█▀▄▄▄▄▄▀ ██ ▀▀ ██▄▀▀█▀█▀▄█▀▀ ▀▀▄ ▀ ▀ ▄▀█
█ █  █▄▄ ██▀▀▀▀▄ ██▀▄ █▄▄▄ ▄▀▀█ ▀▄▀███ █▄▀█
█▄ ▄▀▀█▄██ ▄▄  █▀ ██ ▄▀▄▄▀▄█  █▀ ▀▄▀███ ▄ █
█▄▀▀▀▀ ▄ ███▀█▀▄▀    ▄▀▄███ █▄█▀  ▀▄ ▄█▄▄ █
█▄  ▀▀█▄▄▀ ▄▄▄▀██  ▄▀▄ █▄▀▀█ ▄▄ ▄█▄█ ▄ ▀███
█▄██▀ ▀▄▄▄█▄▀█▄▀▄▄  █▄█▀▀▀▄▄ ▀▀ ▀██ █   ███
██▄█▄█▄▄▄ █ █▄▄▄▀ █▄▀▄█▀█▄  ▄▀  ▄ ▄▄▄ ▄▀▀ █
█ ▄▄▄▄▄ ███▀▄▀▀ █▄▄▀▀███ ▄  █▄██▄ █▄█ ▀█▀▀█
█ █   █ █▀▄ ▀ ▀█▄▀█   ▄▄██▄▄▄▀█▀▀  ▄  █  ▀█
█ █▄▄▄█ █ █▄ ██▀▄ ██▄▄ ▄▀▀█▄█▄█▄ ▄█▀▀█▀█ ▄█
█▄▄▄▄▄▄▄█▄█▄█▄██▄██▄██▄▄██▄█▄▄▄▄▄▄█▄█▄█▄▄██

Share available at: https://ipfs.io/ipfs/QmUzv6Nhtj7VcTsaA2h5kRy3uirq8sKYeDqD12uH2KTVaA#nWTo+ALacrrpnV8lYUoZHZZNrqIjAOgKz5Ibi1E6H9A=
```

## How does it work?

When sharing a new file, aesh first reads its contents and encrypts them using the `aes-256-cbc` algorithm. The key used for encrypting the file is generated randomly and can later be used to decrypt it again.

The share-link presented later (which is also the link stored inside the QR code) contains this key in the fragment identifier (the # hash) of the URL – this section [never leaves the browser](https://www.rfc-editor.org/rfc/rfc2396#section-4) during HTTP requests.

After encrypting your file, aesh embeds the encrypted contents in a small HTML file, that contains a few lines of JavaScript, which is what is actually being uploaded to IPFS.

Utilitizing the [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt), the HTML file takes the fragment identifiert (hash # section) from the URL used to access it to decrypt the baked-in contents of the original file.

After successful decryption, a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) is generated from the decrypted contents, which is then either offered for download, or previewed in the browser directly, depending on the mime-type and browser support – as a fallback, a "download link" to the blob will be presented to the user.

By default, the program uses [identify-stream](https://www.npmjs.com/package/identify-stream) to automatically determine the mime-type of the file selected for sharing.

## Supported Mime-Types

Any mime-type [supported by identify-stream](https://www.npmjs.com/package/identify-stream#user-content-supported-file-types).

Furthermore, the following types (based on file extension):

| Extension | Mime-Type              | Presentation |
| --------- | ---------------------- | ------------ |
| .iso      | application/x-cd-image | Download     |
| .htm[l]   | text/html              | Preview      |

The fallback mime-type is `text/plain`.

## Taking down local shares

Shares technically cannot be "removed" once they have been [pinned](https://docs.ipfs.io/how-to/pin-files/) by other IPFS nodes. Nevertheless, this is very unlikely to happen in the early stages of a share, or when it's link or QR code has not been distributed yet.

To conveniently remove the shared file from your local IPFS, use:

```bash
> aesh del <file.(txt|pdf|mp3|...)>
```

where the filename corresponds to the source file on your local disk.

Like `add`, the `del`-command works with relative paths just like you were referring to the source file on your disk.

## ae-sh?

It's "ash" [/ɛʃ/](https://itinerarium.github.io/phoneme-synthesis/?w=/ɛʃ/), but the reasonable separation would be aes-sh for AES-share.

## Background

Inspired by [dlnet](https://github.com/ovanwijk/dlnet).

Created to host a digital version of my bachelor thesis – which had to be encrypted – on IPFS. The QR codes were attached to the physical copies.

It was also planned to store the share-link inside NFC tags, but since the library where the thesis would eventually end up used RFID to identify print media, this was not implemented. Though the thought about an NFC tag, which grants access to a digital copy hosted on the decentralized web is still very fancy~.

---
Lesosoftware 2022