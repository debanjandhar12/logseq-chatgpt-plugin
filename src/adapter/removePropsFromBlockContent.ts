export function removePropsFromBlockContent(content: string): string {
    content = content.trim();
    if (content.match(/^\s*(\w|-)*::.*\n?\n?/gmy)) { // Block Content starts with a properties drawer
        content = content.replace(/^\s*(\w|-)*::.*\n?\n?/gmy, '');
    }
    else {  // Block Content starts with a header and might have properties drawer after the header
        const firstLine = content.split("\n")[0];
        let restOfContent = content.split("\n").slice(1).join("\n");
        restOfContent = restOfContent.replace(/^\s*(\w|-)*::.*\n?\n?/gmy, '');
        content = firstLine + '\n' + restOfContent;
    }
    return content.trim();
}
