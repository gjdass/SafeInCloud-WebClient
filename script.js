/*
** HERE starts the ugliest JS I ever wrote
** GitHub @gjdass https://github.com/gjdass
*/

var encryptedFile;

function test() {
    var buf = new ArrayBuffer(8);
    var view = new DataView(buf, 0, 4);
    view.get
}

function readDbFile() {
    var fileInput = document.getElementById('fileInput');

    var file = fileInput.files[0];
    if (file == null || file == undefined)
    {
        console.error('File not found - error while reading file');
        return;
    }
    var reader = new FileReader();
    reader.onload = (e) => {
        encryptedFile = reader.result;
        alert('Encrypted file in memory');
    };
    // then we read
    reader.readAsArrayBuffer(file);
}

function go() {
    var pass = document.getElementById("passwordField").value;
    if (pass == null || pass == undefined || pass == '')
    {
        alert('Please type a password first :)');
        return;
    }
    if (encryptedFile == null || encryptedFile == undefined || encryptedFile == '')
    {
        alert('Import a file first !');
        return;
    }
    var curOffset = 0;
    var tmp;

    console.log('-- current_offset=', curOffset);

    var s = struct('H'); // short = 2 bytes
    var magic = s.unpack_from(encryptedFile, curOffset)[0];
    console.log('magic=', magic);
    curOffset += 2;

    console.log('-- current_offset=', curOffset);

    s = struct('B'); // 1 byte
    var sver = s.unpack_from(encryptedFile, 2)[0];
    console.log('sver=', sver);
    curOffset += 1;

    console.log('-- current_offset=', curOffset);

    s = struct('B');
    tmp = s.unpack_from(encryptedFile, curOffset)[0];
    curOffset++;
    s = struct(tmp + 's');
    var salt = s.unpack_from(encryptedFile, curOffset)[0];
    console.log('salt=', salt);
    curOffset += tmp;

    console.log('-- current_offset=', curOffset);

    var pbk = new PBKDF2(pass, salt, 10000, 32);
    pbk.deriveKey(() => {}, (skey) => {
        console.log('skey=', skey);

        s = struct('B');
        tmp = s.unpack_from(encryptedFile, curOffset)[0];
        curOffset++;
        s = struct(tmp + 's');
        var iv = s.unpack_from(encryptedFile, curOffset)[0];
        console.log('iv=', iv);
        curOffset += tmp;

        console.log('-- current_offset=', curOffset);

        s = struct('B');
        tmp = s.unpack_from(encryptedFile, curOffset)[0];
        curOffset++;
        s = struct(tmp + 's');
        var salt2 = s.unpack_from(encryptedFile, curOffset)[0];
        console.log('salt2=', salt2);
        curOffset += tmp;

        console.log('-- current_offset=', curOffset);

        s = struct('B');
        tmp = s.unpack_from(encryptedFile, curOffset)[0];
        curOffset++;
        s = struct(tmp + 's');
        var block = s.unpack_from(encryptedFile, curOffset)[0];
        console.log('block=', block);
        curOffset += tmp;

        console.log('-- current_offset=', curOffset);

        var cipher = new aesjs.ModeOfOperation.cbc(hexaStringToUInt8Array(skey), binaryToUInt8Array(iv));
        var decr = cipher.decrypt(binaryToUInt8Array(block));
        console.log('decripted block=', decr);

        var sub_buf = decr.buffer; // uint8array to arraybuffer

        var curOffset2 = 0;
        console.log('-- current_offset2=', curOffset2);

        s = struct('B');
        tmp = s.unpack_from(sub_buf, curOffset2)[0];
        curOffset2++;
        s = struct(tmp + 's');
        var iv2 = s.unpack_from(sub_buf, curOffset2)[0];
        console.log('iv2=', iv2);
        curOffset2 += tmp;

        console.log('-- current_offset2=', curOffset2);

        s = struct('B');
        tmp = s.unpack_from(sub_buf, curOffset2)[0];
        curOffset2++;
        s = struct(tmp + 's');
        var pass2 = s.unpack_from(sub_buf, curOffset2)[0];
        console.log('pass2=', pass2);
        curOffset2 += tmp;

        console.log('-- current_offset2=', curOffset2);

        s = struct('B');
        tmp = s.unpack_from(sub_buf, curOffset2)[0];
        curOffset2++;
        s = struct(tmp + 's');
        var check = s.unpack_from(sub_buf, curOffset2)[0];
        console.log('check=', check);
        curOffset2 += tmp;

        console.log('-- current_offset2=', curOffset2);

        var pbk = new PBKDF2(pass2, salt2, 10000, 32);
        pbk.deriveKey(() => {}, (skey2) => {
            console.log('skey2=', skey2);
            cipher = new aesjs.ModeOfOperation.cbc(binaryToUInt8Array(pass2), binaryToUInt8Array(iv2));
            var data = cipher.decrypt(new Uint8Array(encryptedFile.slice(curOffset)));
            console.log('decripted file=', data);

            var fileDecryped = pako.inflate(data, { to: 'string' });

            var x2js = new X2JS();
            console.log(JSON.stringify(x2js.xml_str2json(fileDecryped)));
            alert('DONE :) Look in the console (F12)');
        });
    });
}

function binaryToUInt8Array(bStr) {
    // https://gist.github.com/getify/7325764
	var i, len = bStr.length, u8_array = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		u8_array[i] = bStr.charCodeAt(i);
	}
	return u8_array;
}

function convertUint8ArrayToBinaryString(u8Array) {
    // https://gist.github.com/getify/7325764
	var i, len = u8Array.length, b_str = "";
	for (i=0; i<len; i++) {
		b_str += String.fromCharCode(u8Array[i]);
	}
	return b_str;
}

function hexaStringToUInt8Array(h) {
    // https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript
    return new Uint8Array(h.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
}