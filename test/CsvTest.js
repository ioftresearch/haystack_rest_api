var Test = require('./Test');

/**
 * CsvTest tests the zinc reader/writer
 * @constructor
 */
function CsvTest() {}
CsvTest.prototype = Object.create(Test.prototype);
module.exports = CsvTest;

var HZincReader = require('../io/HZincReader'),
    HCsvWriter = require('../io/HCsvWriter');

function isNull(obj) {
  return typeof(obj) === 'undefined' || obj === null;
}

function verifyGrid(zinc, csv) {
  // read from zinc
  var grid = new HZincReader(zinc).readGrid();
  var csvString = HCsvWriter.gridToString(grid);
  Test.verifyEq(csvString, csv);
}

CsvTest.test = function() {

  verifyGrid(
      "ver:\"2.0\"\n" +
      "fooBar33\n" +
      "\n",
      "fooBar33\n"
  );

  verifyGrid(
      "ver:\"2.0\" tag foo:\"bar\"\n" +
      "xyz\n" +
      "\"val\"\n" +
      "\n",
      "xyz\n" +
      "val\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "val\n" +
      "N\n" +
      "\n",
      "val\n" +
      "\"\"\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a,b\n" +
      "1,2\n" +
      "3,4\n" +
      "\n",
      "a,b\n" +
      "1,2\n" +
      "3,4\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a,    b,      c,      d\n" +
      "T,    F,      N,   -99\n" +
      "2.3,  -5e-10, 2.4e20, 123e-10\n" +
      "\"\",   \"a\",   \"\\\" \\\\ \\t \\n \\r\", \"\\uabcd\"\n" +
      "`path`, @12cbb082-0c02ae73, 4s, -2.5min\n" +
      "M,R,Bin(image/png),Bin(image/png)\n" +
      "2009-12-31, 23:59:01, 01:02:03.123, 2009-02-03T04:05:06Z\n" +
      "INF, -INF, \"\", NaN\n" +
      "C(12,-34),C(0.123,-.789),C(84.5,-77.45),C(-90,180)\n" +
      "\n",
      "a,b,c,d\n" +
      "true,false,\"\",-99\n" +
      "2.3,-5e-10,240000000000000000000,1.23e-8\n" +
      "\"\",a,\"\"\" \\ \t \n \r\",\uabcd\n" +
      "path,@12cbb082-0c02ae73,4s,-2.5min\n" +
      "\u2713,remove,Bin(image/png),Bin(image/png)\n" +
      "2009-12-31,23:59:01,01:02:03.123,2009-02-03T04:05:06Z UTC\n" +
      "INF,-INF,\"\",NaN\n" +
      "\"C(12.0,-34.0)\",\"C(0.123,-0.789)\",\"C(84.5,-77.45)\",\"C(-90.0,180.0)\"\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "foo\n" +
      "`foo$20bar`\n" +
      "`foo\\`bar`\n" +
      "`file \\#2`\n" +
      "\"$15\"\n",
      "foo\n" +
      "foo$20bar\n" +
      "foo`bar\n" +
      "file \\#2\n" +
      "$15\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a, b\n" +
      "-3.1kg,4kg\n" +
      "5%,3.2%\n" +
      "5kWh/ft\u00b2,-15kWh/m\u00b2\n" +
      "123e+12kJ/kg_dry,74\u0394\u00b0F\n",
      "a,b\n" +
      "-3.1kg,4kg\n" +
      "5%,3.2%\n" +
      "5kWh/ft\u00b2,-15kWh/m\u00b2\n" +
      "123000000000000kJ/kg_dry,74\u0394\u00b0F\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a,b\n" +
      "2010-03-01T23:55:00.013-05:00 GMT+5,2010-03-01T23:55:00.013+10:00 GMT-10\n",
      "a,b\n" +
      "2010-03-01T23:55:00.013-05:00 GMT+5,2010-03-01T23:55:00.013+10:00 GMT-10\n"
  );

  verifyGrid(
      "ver:\"2.0\" a: 2009-02-03T04:05:06Z foo b: 2010-02-03T04:05:06Z UTC bar c: 2009-12-03T04:05:06Z London baz\n" +
      "a\n" +
      "3.814697265625E-6\n" +
      "2010-12-18T14:11:30.924Z\n" +
      "2010-12-18T14:11:30.925Z UTC\n" +
      "2010-12-18T14:11:30.925Z London\n" +
      "45$\n" +
      "33\u00a3\n" +
      "@12cbb08e-0c02ae73\n" +
      "7.15625E-4kWh/ft\u00b2\n",
      "a\n" +
      "0.000003814697265625\n" +
      "2010-12-18T14:11:30.924Z UTC\n" +
      "2010-12-18T14:11:30.925Z UTC\n" +
      "2010-12-18T14:11:30.925Z London\n" +
      "45$\n" +
      "33\u00a3\n" +
      "@12cbb08e-0c02ae73\n" +
      "0.000715625kWh/ft\u00b2\n"
  );

  verifyGrid(
      "ver:\"2.0\" bg: Bin(image/jpeg) mark\n" +
      "file1 dis:\"F1\" icon: Bin(image/gif),file2 icon: Bin(image/jpg)\n" +
      "Bin(text/plain),N\n" +
      "4,Bin(image/png)\n" +
      "Bin(text/html; a=foo; bar=\"sep\"),Bin(text/html; charset=utf8)\n",
      "F1,file2\n" +
      "Bin(text/plain),\"\"\n" +
      "4,Bin(image/png)\n" +
      "\"Bin(text/html; a=foo; bar=\"\"sep\"\")\",Bin(text/html; charset=utf8)\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a, b, c\n" +
      ", 1, 2\n" +
      "3, , 5\n" +
      "6, 7_000,\n" +
      ",,10\n" +
      ",,\n" +
      "14,,\n" +
      "\n",
      "a,b,c\n" +
      "\"\",1,2\n" +
      "3,\"\",5\n" +
      "6,7000,\"\"\n" +
      "\"\",\"\",10\n" +
      "\"\",\"\",\"\"\n" +
      "14,\"\",\"\"\n"
  );
};
