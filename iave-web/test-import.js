const SignatureCanvas = require('react-signature-canvas');
console.log('Type of default export:', typeof SignatureCanvas);
console.log('Is it a class?', SignatureCanvas.toString().startsWith('class'));
console.log('Is it a function?', typeof SignatureCanvas === 'function');
console.log('Properties:', Object.keys(SignatureCanvas));
if (typeof SignatureCanvas === 'object') {
    console.log('Default property?', SignatureCanvas.default);
}
