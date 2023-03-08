export function removePropsFromBlockContent(content : string) : string {
    content = content.replace(/:PROPERTIES:\n((.|\n)*?):END:\n?/gm, ""); //Remove org properties
    content = content.replace(/^\s*(\w|-)*::.*\n?\n?/gm, ""); // Remove md properties
    return content;
}