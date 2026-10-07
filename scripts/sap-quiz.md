# Private SAP-C02 quiz

The standalone page is served from `/sap-c02-dump/`. It initially shows a password form. A correct password unlocks the quiz; a wrong password redirects to `/`. Network or asset errors stay on the form with an error message. It lives under `static/`, so Hugo does not add it to navigation, page lists, sitemap, RSS, or the search index. Its HTML also requests `noindex,nofollow,noarchive`. Do not add links to it elsewhere.

Only `questions.enc.json` is published. The Markdown source and password remain under the Git-ignored `.idea/pj/` directory. AES-256-GCM encrypts the complete question bank; PBKDF2-HMAC-SHA256 derives the key using a random 16-byte salt and 600,000 iterations. Each build uses a fresh 12-byte IV. Neither the password nor the encryption key is included in public assets. Unlocking uses Web Crypto on HTTPS; localhost also works for development. No external scripts or services are used.

GitHub Pages still serves the page shell and encrypted file publicly. Encryption protects the question content with a strong password; it does not provide server-side access control or hide the route from repository readers. Someone with the password can copy the decrypted questions. A weak password can be guessed offline. For private access to the entire page, use hosting with server-side authentication.

## Rebuild or change password

Run `node scripts/build-sap-quiz.mjs` from the repository root after updating the private Markdown. The script reads `.idea/pj/sap-c02-password.txt`, or the `SAP_QUIZ_PASSWORD` environment variable. No Markdown source or password is needed during deployment: commit the generated encrypted file alongside the HTML, CSS, and JS.

For initial setup, `node scripts/build-sap-quiz.mjs --generate-password` generates a random password and saves it locally. It refuses to overwrite an existing password file. To change the password, edit that ignored file locally and rebuild. Do not commit the password, plaintext question bank, or decrypted test fixtures. Previously published encrypted files remain decryptable with their original passwords.

## Source quality

Question IDs are preserved, including gaps. Answers are copied from the source without certifying their correctness. Entries with a mismatch between the required answer count and source key, or missing policy text after “following:”, are shown as incomplete and excluded from scoring. Single answers reveal immediately; multiple answers reveal once the requested number is selected. Revealing the source answer without attempting does not count as a graded answer. Progress and decrypted questions stay in memory, and are cleared on lock or reload.
