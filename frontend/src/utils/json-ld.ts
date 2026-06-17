/**
 * Serialize a JSON-LD object for safe embedding inside a
 * `<script type="application/ld+json">` tag.
 *
 * `JSON.stringify` does not escape `<`, so a value containing `</script>`
 * (e.g. attacker-controlled product data from the API) could break out of
 * the script element and inject markup. Escaping `<` to its unicode form
 * neutralises `</script>` and `<!--` breakouts while keeping the JSON valid.
 * The content type is `application/ld+json` (data, not executable JS), so the
 * `<` escape is the only one needed — line/paragraph separators do not affect
 * parsing of a data block.
 */
export const serializeJsonLd = (data: object): string =>
  JSON.stringify(data).replace(/</g, '\\u003c');
