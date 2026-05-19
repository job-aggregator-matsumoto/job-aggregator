var streamIn = new ActiveXObject("ADODB.Stream");
streamIn.Type = 2;
streamIn.Charset = "utf-8";
streamIn.Open();
streamIn.LoadFromFile("C:\\Users\\user\\jobs_extracted.json");
var json = streamIn.ReadText();
streamIn.Close();

var jsContent = "const initialJobsData = " + json + ";";

var streamOut = new ActiveXObject("ADODB.Stream");
streamOut.Type = 2;
streamOut.Charset = "utf-8";
streamOut.Open();
streamOut.WriteText(jsContent);
streamOut.SaveToFile("c:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u30de\u30a4\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831\u307e\u3068\u3081\u30b5\u30a4\u30c8\\data\\jobs_data.js", 2);
streamOut.Close();

WScript.Echo("Updated jobs_data.js with 519 jobs.");
