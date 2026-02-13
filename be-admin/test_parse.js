const parseComments = require('./utils/parseComments');

try {
    const comments = parseComments();
    console.log("Parsed Comments:", JSON.stringify(comments, null, 2));
} catch (error) {
    console.error("Parsing failed:", error);
}
