# ipfs-secure-qr-share

Encrypt and share files via IPFS using QR codes.

## Requirements

* Nodejs
* IPFS (having the `ipfs`-command present in your `PATH`)

## Usage

The following command will encrypt a file, upload it into IPFS and return a QR code + URL representing the newly created object inside IPFS.

```bash
> node share.js <file.(txt|pdf|mp3|...)>
```

## Example

```bash
> node . hello-world.txt 

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

Before uploading your file to IPFS, `share.js` encrypts it using the `aes-256-cbc` algorithm.

When presenting you with the QR code (and the plain link to the share), the The key for decrypting the file is appended as the fragment identifier (the # hash) of the URL. This information [never leaves the browser](https://www.rfc-editor.org/rfc/rfc2396#section-4).

What `share.js` actually uploads to IPFS is a small HTML page, that runs JavaScript inside. Utilitizing the [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt), the encrypted file contents baked into the HTML document are then decrypted using the user-provided, base64 encoded AES key from the fragment identifier of the URL.

After decrypting the file successfully, the browser generates a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) from the decrypted contents and redirects the browser to that URL (if supported, otherwise a link to the blob will be displayed to the user).

The program also uses the [identify-stream](https://www.npmjs.com/package/identify-stream) package to automatically determine the mime-type of the uploaded document - the browser uses this information when constructing the Blob object. You can check the list of mime-types supported by identify-stream [here](https://www.npmjs.com/package/identify-stream#user-content-supported-file-types). The fallback mime-type is `text/plain`.

## Inspiration

Created to archive my bachelor thesis inside IPFS, which had to be done encrypted. The QR codes were attached to the physical copies of the thesis.

More ideas: Why not store your share URL inside an NFC tag?

---
Lesosoftware 2022