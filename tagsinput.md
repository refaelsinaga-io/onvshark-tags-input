# ONVSHARK TAGS INPUT

**Author** : Refael Sinaga 2026 | refaelsinaga.com  
**Version** : 1.1.0  
**Prefix**  : `onvs-tagsinput-`  
**Function** : `OnvTagsInput.init()`

---

## Install

Cukup include 2 file, tidak perlu library lain.

```html
<link href="onvshark-tags-input/tagsinput.css" rel="stylesheet">
<script src="onvshark-tags-input/tagsinput.js"></script>
```

---

## Penggunaan

```html
<input type="text" id="kota" name="kota" class="form-control" value="Amsterdam,Sydney" placeholder="Ketik lalu Enter">

<script src="onvshark-tags-input/tagsinput.js"></script>
<script>
    const kota = OnvTagsInput.init('kota');
</script>
```

```js
OnvTagsInput.init(id, options)
```

### Parameter

| # | Parameter | Type                          | Keterangan |
|---|-----------|-------------------------------|------------|
| 1 | `id`      | `string` / `HTMLInputElement` | id input (`'kota'` atau `'#kota'`) atau elemen input |
| 2 | `options` | `object`                      | Opsional (lihat di bawah) |

### Konfigurasi `options`

```js
{
  source    : null,   // kosong = tag bebas | array = master lokal | string URL = cari ke server
  creatable : false,  // dengan source: teks di luar daftar boleh jadi tag baru
  max       : 0,      // batas jumlah tag, 0 = tanpa batas
  separator : ','     // pemisah value di input
}
```

### Mode

| `source`                          | Perilaku |
|-----------------------------------|----------|
| kosong                            | **Tag bebas**. Ketik lalu Enter atau koma. Paste `a,b,c` jadi 3 tag. Teks tersisa saat keluar field ikut jadi tag |
| array                             | **Master lokal**. Ketik = cari di daftar, pilih dengan klik atau panah + Enter. Teks di luar daftar ditolak. Array dibaca langsung: `push` / `splice` ke array yang sama = daftar ikut ter-update |
| string URL (`'/api/kota?q='`)     | **Master dari server**. Sama seperti array, tapi daftar diambil lewat `fetch(url + teks)` saat mengetik (jeda 250 ms) |
| array / URL + `creatable: true`   | **Master + tag baru**. Seperti master, tapi kalau teks tidak sama persis dengan daftar muncul pilihan **+ Tambah "teks"**. Tag baru: value = teksnya, chip warna beda (`.onvs-tagsinput-tag-new`) |

Isi master boleh string atau object:

```js
['Berita', 'Olahraga']                              // value = label
[{ value: 1, label: 'Berita' }, { value: 2, label: 'Olahraga' }]   // input simpan value, chip tampil label
```

Endpoint URL harus mengembalikan JSON dalam bentuk array di atas, atau `{ data: [...] }` (hasil Laravel resource / paginate).

### Return

| Property / Method | Keterangan |
|-------------------|------------|
| `getTags()`       | Array value, contoh `['1', '5']` (tag baru: value = teksnya) |
| `getNewTags()`    | Array teks tag baru (creatable), contoh `['Remaja']` |
| `setTags(list)`   | Ganti semua tag. Isi string (value) atau `{ value, label }` |
| `add(tag)`        | Tambah satu tag. Return `false` kalau duplikat / penuh / kosong |
| `remove(value)`   | Hapus tag berdasarkan value |
| `element`         | Elemen pembungkus (`.onvs-tagsinput`) |

---

## Contoh

### Tag bebas
```js
OnvTagsInput.init('kota');
```

### Master dari helper / Blade
```js
OnvTagsInput.init('kategori', { source: @json($kategori) });
```

### Master dari database lewat URL
```js
OnvTagsInput.init('provinsi', { source: '{{ route('api.provinsi') }}?q=', max: 3 });
```

```php
// Route contoh
Route::get('/api/provinsi', function (Request $request) {
    return DB::table('provinsi')
        ->where('nama', 'like', '%' . $request->q . '%')
        ->limit(20)
        ->get(['id as value', 'nama as label']);
})->name('api.provinsi');
```

### Form edit dengan master URL
Value awal di input hanya berisi id, jadi chip menampilkan id. Isi label lewat `setTags`:
```js
const provinsi = OnvTagsInput.init('provinsi', { source: '/api/provinsi?q=' });
provinsi.setTags(@json($terpilih)); // [{ value: 3, label: 'Banten' }]
```

### Master + tag baru (creatable)
```js
OnvTagsInput.init('kategori', { source: @json($kategori), creatable: true });
```
Di server, value yang bukan id master = nama tag baru (pakai yang sudah ada kalau namanya sama):
```php
$ids = [];
foreach (array_filter(explode(',', $request->kategori)) as $v) {
    $ids[] = DB::table('kategori')->where('id', $v)->value('id')
        ?? DB::table('kategori')->where('nama', $v)->value('id')
        ?? DB::table('kategori')->insertGetId(['nama' => $v]);
}
```

### Simpan di Laravel
```php
$ids = array_filter(explode(',', $request->kota));
```

### Dengar perubahan
```js
document.getElementById('kota').addEventListener('change', e => console.log(e.target.value));
```

---

## Tema

Kotak input ikut tema project: class asli input (mis. `form-control`) dipindah ke wrapper. Input tanpa class memakai tampilan dasar `.onvs-tagsinput-plain`.

Warna chip dan daftar pilihan lewat CSS variable:

| Variable                         | Default   | Keterangan |
|----------------------------------|-----------|------------|
| `--onvs-tagsinput-tag-bg`        | `#5bc0de` | Background chip |
| `--onvs-tagsinput-tag-text`      | `#fff`    | Teks chip |
| `--onvs-tagsinput-tag-radius`    | `4px`     | Sudut chip |
| `--onvs-tagsinput-list-bg`       | `#fff`    | Background daftar pilihan |
| `--onvs-tagsinput-list-border`   | `#d0d5dd` | Border daftar pilihan |
| `--onvs-tagsinput-list-hover`    | `#e9ecf2` | Item aktif |
| `--onvs-tagsinput-muted`         | `#98a2b3` | Placeholder, "Tidak ditemukan" |
| `--onvs-tagsinput-tag-new-bg`    | `#f79009` | Background chip tag baru (creatable) |
| `--onvs-tagsinput-create-text`   | `#1a4099` | Teks pilihan "+ Tambah" (creatable) |

```css
.onvs-tagsinput {
    --onvs-tagsinput-tag-bg: #2ab57d;
}
```

Efek fokus: input asli disembunyikan, jadi `.form-control:focus` tema tidak kena. Tambahkan di project:

```css
.onvs-tagsinput.form-control:focus-within { border-color: #86b7fe; box-shadow: 0 0 0 .25rem rgba(13, 110, 253, .25); }
```

---

## Perilaku

- Input asli disembunyikan dan value-nya selalu ikut ter-update (`"a,b,c"`), jadi form submit Laravel jalan seperti biasa
- Setiap perubahan tag memicu event `change` di input asli
- Satu instance per input; `init` dua kali di id yang sama mengembalikan instance yang sudah ada
- Tag duplikat (value sama) diabaikan; value yang berisi separator ditolak
- Backspace di field kosong = hapus tag terakhir
- Esc = tutup daftar pilihan
- Enter di field kosong tidak ditahan, jadi form tetap bisa submit
- Mode master: item yang sudah dipilih tidak muncul lagi di daftar; teks yang tidak dipilih dibuang saat keluar field
- Creatable: "+ Tambah" hanya muncul kalau teks tidak sama persis (abaikan huruf besar/kecil) dengan daftar atau tag terpilih; tanpa `source`, `creatable` diabaikan
- `add()` / `setTags()` dari kode tidak dicek ke master (tanggung jawab developer)
- Input dengan `required` perlu divalidasi manual, karena input disembunyikan
- Input `disabled` / `readonly` belum didukung

---

## File

| File             | Keterangan |
|------------------|------------|
| `tagsinput.css`  | Tampilan chip dan daftar pilihan |
| `tagsinput.js`   | Library |
| `tagsinput.md`   | Dokumentasi ini |
| `index.html`     | Contoh pemakaian |
| `test.html`      | Cek otomatis, harus tampil "Semua 24 cek OK" |

---

## Independence Check

| Dependency      | Status |
|-----------------|--------|
| CSS framework   | Tidak (ikut class tema kalau ada) |
| JS framework    | Tidak  |
| Icon library    | Tidak  |
| jQuery          | Tidak  |
