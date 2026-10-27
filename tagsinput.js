/**
 * ONVSHARK TAGS INPUT
 * Author  : Refael Sinaga 2026 | refaelsinaga.com
 * Version : 1.1.0
 * Prefix  : onvs-tagsinput-
 *
 * OnvTagsInput.init(id, options)
 *
 * @param {string|HTMLInputElement} id      - id input ('kota' atau '#kota') atau elemen input
 * @param {object}                  options - opsional
 *
 * options = {
 *   source    : ['A', 'B'] | [{ value: 1, label: 'A' }] | '/api/kota?q=',
 *               // kosong = tag bebas (ketik lalu Enter / koma)
 *               // ada    = cari dan pilih dari daftar, teks di luar daftar ditolak
 *   creatable : true,  // dengan source: teks di luar daftar boleh jadi tag baru ("+ Tambah ...");
 *                      // value tag baru = teksnya, getNewTags() mengembalikan daftarnya
 *   max       : 5,     // batas jumlah tag (default: tanpa batas)
 *   separator : ','    // pemisah value di input (default: ',')
 * }
 *
 * @returns {object} tags = { element, getTags(), getNewTags(), setTags(list), add(tag), remove(value) }
 */
(function (global) {
    "use strict";

    // String atau { value, label, isNew } -> { value, label, isNew }, value selalu string
    function item(x) {
        if (x && typeof x === "object") {
            var v = x.value != null ? x.value : x.label;
            return { value: String(v).trim(), label: String(x.label != null ? x.label : v).trim(), isNew: !!x.isNew };
        }
        return { value: String(x).trim(), label: String(x).trim(), isNew: false };
    }

    function init(target, opts) {
        var input = typeof target === "string" ? document.getElementById(target.replace(/^#/, "")) : target;
        if (!input || input.nodeName !== "INPUT") throw new Error("OnvTagsInput: input '" + target + "' tidak ditemukan");
        return input._onvTagsInput || (input._onvTagsInput = create(input, opts || {}));
    }

    function create(input, opts) {
        var sep = opts.separator || ",";
        var max = opts.max || 0;
        var source = opts.source || null;
        var strict = !!source; // ada master = hanya boleh pilih dari daftar
        var creatable = strict && !!opts.creatable; // ... kecuali creatable: teks baru boleh jadi tag
        var master = Array.isArray(source) ? source : null; // dibaca langsung tiap cari: push ke array = daftar ikut ter-update
        var placeholder = input.placeholder || "";
        var tags = [], found = [], active = -1, timer = null, req = 0;

        // Class asli input (mis. form-control) pindah ke wrapper, jadi tampilan ikut tema project
        var wrap = el("div", "onvs-tagsinput " + (input.className || "onvs-tagsinput-plain"));
        var field = el("input", "onvs-tagsinput-field");
        var drop = el("ul", "onvs-tagsinput-list");
        field.type = "text";
        field.autocomplete = "off";
        field.setAttribute("aria-label", placeholder || input.name || "Tags");
        if (strict) {
            field.setAttribute("role", "combobox");
            field.setAttribute("aria-autocomplete", "list");
            field.setAttribute("aria-expanded", "false");
        }
        drop.setAttribute("role", "listbox");
        drop.hidden = true;

        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(field);
        wrap.appendChild(drop);
        wrap.appendChild(input);
        input.hidden = true;

        // Label for="id" menunjuk input yang disembunyikan; arahkan ke field
        Array.prototype.forEach.call(input.labels || [], function (l) {
            l.addEventListener("click", function (e) { e.preventDefault(); field.focus(); });
        });

        // Value -> tag dengan label dari master (kalau ada)
        function lookup(v) {
            v = String(v).trim();
            return (master && master.map(item).filter(function (t) { return t.value === v; })[0]) || v;
        }

        function has(v) {
            return tags.some(function (t) { return t.value === v; });
        }

        function push(x) {
            var t = item(x);
            if (!t.value || t.value.indexOf(sep) >= 0 || has(t.value) || (max && tags.length >= max)) return false;
            tags.push(t);
            return true;
        }

        function render(silent) {
            Array.prototype.slice.call(wrap.querySelectorAll(".onvs-tagsinput-tag")).forEach(function (c) { wrap.removeChild(c); });
            tags.forEach(function (t) {
                var chip = el("span", "onvs-tagsinput-tag" + (t.isNew ? " onvs-tagsinput-tag-new" : ""));
                var x = el("button", "onvs-tagsinput-remove");
                chip.textContent = t.label;
                x.type = "button";
                x.innerHTML = "&times;";
                x.setAttribute("aria-label", "Hapus " + t.label);
                x.addEventListener("click", function (e) {
                    e.stopPropagation();
                    remove(t.value);
                    field.focus();
                });
                chip.appendChild(x);
                wrap.insertBefore(chip, field);
            });
            field.placeholder = tags.length ? "" : placeholder;
            var v = tags.map(function (t) { return t.value; }).join(sep);
            if (input.value === v) return;
            input.value = v;
            if (!silent) input.dispatchEvent(new Event("change", { bubbles: true }));
        }

        function add(x) {
            if (!push(x)) return false;
            render();
            return true;
        }

        function remove(v) {
            v = String(v);
            if (!has(v)) return;
            tags = tags.filter(function (t) { return t.value !== v; });
            render();
        }

        // Mode bebas: teks yang diketik (bisa "a,b,c" hasil paste) jadi tag
        function addTyped() {
            if (strict) return;
            field.value.split(sep).forEach(function (v) { push(v); });
            field.value = "";
            render();
        }

        function search() {
            if (max && tags.length >= max) return close();
            var q = field.value.trim().toLowerCase();
            if (master) return show(master.map(item).filter(function (t) { return t.label.toLowerCase().indexOf(q) >= 0; }));

            var id = ++req; // hanya respon request terakhir yang dipakai
            clearTimeout(timer);
            timer = setTimeout(function () {
                show(null);
                fetch(source + encodeURIComponent(q), { headers: { Accept: "application/json" } })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        // Terima array langsung atau { data: [...] } (Laravel resource / paginate)
                        if (id === req) show((Array.isArray(data) ? data : data.data || []).map(item));
                    })
                    .catch(function () { if (id === req) show([]); });
            }, 250);
        }

        // Creatable: teks yang tidak sama persis (abaikan huruf besar/kecil) dengan daftar / tag terpilih -> pilihan "+ Tambah"
        function createItem(items) {
            var q = field.value.trim(), low = q.toLowerCase();
            var same = function (t) { return t.label.toLowerCase() === low; };
            if (!creatable || !items || !q || q.indexOf(sep) >= 0 || items.some(same) || tags.some(same)) return null;
            return { value: q, label: q, isNew: true };
        }

        // items null = sedang mencari
        function show(items) {
            if (document.activeElement !== field) return;
            found = (items || []).filter(function (t) { return t.value && !has(t.value); });
            var extra = createItem(items);
            if (extra) found.push(extra);
            active = found.length ? 0 : -1;
            drop.innerHTML = "";
            if (!found.length) {
                var empty = el("li", "onvs-tagsinput-empty");
                empty.textContent = items ? "Tidak ditemukan" : "Mencari...";
                drop.appendChild(empty);
            }
            found.forEach(function (t, i) {
                var li = el("li", "onvs-tagsinput-item" + (t.isNew ? " onvs-tagsinput-create" : ""));
                li.textContent = t.isNew ? "+ Tambah \"" + t.label + "\"" : t.label;
                li.setAttribute("role", "option");
                li.addEventListener("mousedown", function (e) {
                    e.preventDefault(); // fokus tetap di field
                    choose(t);
                });
                li.addEventListener("mouseenter", function () { active = i; mark(); });
                drop.appendChild(li);
            });
            mark();
            drop.hidden = false;
            field.setAttribute("aria-expanded", "true");
        }

        function close() {
            clearTimeout(timer);
            req++;
            drop.hidden = true;
            found = [];
            active = -1;
            if (strict) field.setAttribute("aria-expanded", "false");
        }

        function choose(t) {
            add(t);
            field.value = "";
            search(); // daftar tetap terbuka untuk pilih berikutnya
        }

        function mark() {
            Array.prototype.forEach.call(drop.querySelectorAll(".onvs-tagsinput-item"), function (li, i) {
                li.classList.toggle("onvs-tagsinput-active", i === active);
                li.setAttribute("aria-selected", String(i === active));
                if (i === active) li.scrollIntoView({ block: "nearest" });
            });
        }

        field.addEventListener("keydown", function (e) {
            var open = !drop.hidden;
            if ((e.key === "ArrowDown" || e.key === "ArrowUp") && open && found.length) {
                e.preventDefault();
                active = (active + (e.key === "ArrowDown" ? 1 : -1) + found.length) % found.length;
                mark();
            } else if (e.key === "Enter" || (e.key === sep && !strict)) {
                if (e.key === "Enter" && !field.value && !open) return; // field kosong: biarkan form submit
                e.preventDefault();
                if (!strict) addTyped();
                else if (active >= 0) choose(found[active]);
                // strict tanpa pilihan: teks di luar master ditolak, tidak jadi tag (creatable: pilihan "+ Tambah" ada di daftar)
            } else if (e.key === "Backspace" && !field.value && tags.length) {
                remove(tags[tags.length - 1].value);
                if (open) search();
            } else if (e.key === "Escape" && open) {
                e.preventDefault();
                close();
            }
        });

        field.addEventListener("input", function () {
            if (strict) search();
            else if (field.value.indexOf(sep) >= 0) addTyped(); // paste "a,b,c"
        });
        field.addEventListener("focus", function () { if (strict) search(); });
        field.addEventListener("blur", function () {
            close();
            if (strict) field.value = ""; // teks yang tidak dipilih dibuang
            else addTyped();
        });
        wrap.addEventListener("click", function () { field.focus(); });

        input.value.split(sep).forEach(function (v) { push(lookup(v)); });
        render(true);

        return {
            element: wrap,
            getTags: function () { return tags.map(function (t) { return t.value; }); },
            getNewTags: function () { return tags.filter(function (t) { return t.isNew; }).map(function (t) { return t.label; }); },
            setTags: function (list) {
                tags = [];
                (list || []).forEach(function (x) { push(typeof x === "object" ? x : lookup(x)); });
                render();
            },
            add: function (x) { return add(typeof x === "object" ? x : lookup(x)); },
            remove: remove
        };
    }

    function el(tag, cls) {
        var n = document.createElement(tag);
        n.className = cls;
        return n;
    }

    global.OnvTagsInput = { init: init };
})(window);
