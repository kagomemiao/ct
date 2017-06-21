function htmlSorter(a, b) {
	var a = $(a).text().toLowerCase();
  var b = $(b).text().toLowerCase();
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}