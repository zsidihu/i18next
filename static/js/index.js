const cE = (tag, attributes = {}) => {
	const element = document.createElement(tag);

	for(const [key, value] of Object.entries(attributes)) {
		element.setAttribute(key, value);
	}
	
	return element;
};

const load = document.getElementById("load");
const form = document.getElementById("form");
const apis = "https://clients5.google.com/translate_a/t?";
const data = { client: "dict-chrome-ex", sl: "auto", tl: "", q: "" };

for(let code in langs) {
	form.sl.innerHTML += `<option value="${code}">Source Language: ${langs[code]}</option>`;
	form.tl.innerHTML += `<option value="${code}">Target Language: ${langs[code]}</option>`;
}

let answer = null;

const captchaBox = document.getElementsByClassName("question")[0];
const captchaRow = captchaBox.children;

const setCaptcha = () => {
	const a = Math.floor(Math.random() * 10) + 1;
	const b = Math.floor(Math.random() * 10) + 1;
	
	answer = a + b;
	captchaRow[0].textContent = `What is ${a} + ${b}?`;
	captchaRow[1].value = "";
};

setCaptcha();

const setProgress = (el, percent = 0) => {
	el.setAttribute("data-percent", `${percent}%`);
	el.style.setProperty("--left", `${percent}%`);
	
	if(percent < 50) {
		el.style.setProperty("--color", "black");
	}
	else
	if(percent > 50) {
		el.style.setProperty("--color", "white");
	}
};

const formatJson = (obj, indent = "  ", level = 0) => {
	if(typeof obj !== "object" || obj === null) {
		return JSON.stringify(obj);
	}

	let result = "{\n";

	for(const key in obj) {
		if(obj.hasOwnProperty(key)) {
			const value = obj[key];
			
			result += `${indent.repeat(level + 1)}"${key}": ${formatJson(value, indent, level + 1)},\n`;
		}
	}

	result = result.replace(/,\n$/, "\n");
	result += indent.repeat(level) + "}";
	return result;
};

form.addEventListener("submit", (e) => {
	e.preventDefault();
	
	const action = e.submitter.name;

	if(action === "upload") {
		const input = cE("input", { type: "file", accept: ".json" });
		
		input.onchange = () => {
			if(input.files[0]) {
				const reader = new FileReader();
				
				reader.onload = (e) => form.source.value = e.target.result;
				reader.readAsText(input.files[0]);
			}
		};
		
		input.click();
	}

	else
	if(action === "download") {
		if(form.target.value.length > 0) {
			const str = btoa(String.fromCharCode(...new TextEncoder().encode(form.target.value)));
			const lnk = "data:application/json;charset=utf-8;base64," + str;
			
			cE("a", { download: form.tl.value + ".json", href: lnk }).click();
		}
	}

	else
	if(action === "translate") {
		setCaptcha();
		captchaBox.classList.add("visible");
	}
});

captchaRow[2].addEventListener("click", async () => {
	if(parseInt(captchaRow[1].value) !== answer) {
		alert("Incorrect answer!\nPlease try again.");
		setCaptcha();
		return;
	}

	captchaBox.classList.remove("visible");

	try {
		const sourceJson = JSON.parse(form.source.value);
		const translatedJson = JSON.parse(form.source.value);

		if(form.sl.value === form.tl.value) {
			alert("Same values in options!");
			return;
		}

		load.classList.add("visible");
		data.sl = form.sl.value;
		data.tl = form.tl.value;

		let done = 0;
		const total = Object.keys(sourceJson).length;

		for(let key in sourceJson) {
			for(let subKey in sourceJson[key]) {
				if(subKey === "message") {
					data.q = sourceJson[key][subKey];

					const text = apis + new URLSearchParams(data).toString();
					const json = await fetch(text).then((e) => e.json());

					translatedJson[key][subKey] = data.sl === "auto" ? json[0][0] : json[0];
				}
			}
			
			setProgress(load, ((++done / total) * 100).toFixed());
		}

		load.classList.remove("visible");
		form.target.value = formatJson(translatedJson, "  ");
		form.target.dispatchEvent(new Event("input", { bubbles: true }));
		setTimeout(() => setProgress(load, 0), 500);

	}
	catch(err) {
		alert("Translation error!\n" + err);
	}
});

form.target.addEventListener("input", () => {
	form.download.disabled = (form.target.value.trim() === "");
});

