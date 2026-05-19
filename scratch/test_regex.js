
var h = '<tr><td class="label_col"><span class="bg_label white_back"><div class="flex jus_center"><div>\u8cc1\u91d1</div><div class="fs0_875">\uff08\u624b\u5f53\u7b49\u3092\u542b\u3080\uff09</div></div></span></td><td class="data_col"><div class="flex"><div class="disp_inline_block">183,110\u5186\u301c183,110\u5186</div></div></td></tr><tr><td class="label_col"><span class="bg_label white_back">\u5c31\u696d\u6642\u9593</span></td>';
var label = "\u8cc1\u91d1"; // 賃金
var p = label + "([\\s\\S]*?)(?=<span class=\"bg_label|<div class=\"bg_label|$)";
var m = h.match(new RegExp(p, "i"));

function clean(s) {
    if (!s) return "";
    var res = s.replace(/<[^>]+>/g, "").replace(/^\s+|\s+$/g, "");
    res = res.replace(/\uff1a/g, "");
    return res.replace(/\r\n|\n|\r/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
}

if (m) {
    WScript.Echo("Match found!");
    WScript.Echo("Raw: " + m[1]);
    WScript.Echo("Cleaned: " + clean(m[1]));
} else {
    WScript.Echo("No match.");
}
