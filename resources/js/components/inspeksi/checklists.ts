import type {
    InspeksiCategory,
    InspeksiField,
} from '@/components/inspeksi/inspeksi-form';

export type InspeksiKind = 'kantor' | 'tambang' | 'workshop' | 'mess';

export type InspeksiConfig = {
    kind: InspeksiKind;
    title: string;
    formCode: string;
    categories: readonly InspeksiCategory[];
    fields: InspeksiField[];
};

function formatLokasi(val: string): string {
    return val
        .split(' ')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ')
        .trim();
}

const KANTOR_CATEGORIES = [
    {
        key: 'situasi',
        label: 'Situasi',
        items: [
            {
                key: 'situasi_1',
                label: '1. Atap, Dinding, pintu, jendela dalam kondisi bersih dan baik',
            },
            {
                key: 'situasi_2',
                label: '2. Lantai dalam kondisi bersih dan tidak rusak',
            },
            {
                key: 'situasi_3',
                label: '3. Penerangan di semua area/ruangan memadai/standar',
            },
            {
                key: 'situasi_4',
                label: '4. Ventilasi di semua area/ruangan memadai (tidak pengap)',
            },
            {
                key: 'situasi_5',
                label: '5. House keeping/kebersihan secara umum baik',
            },
            {
                key: 'situasi_6',
                label: '6. Tersedia halaman parkir sarana memadai; Tersedia rambu parkir & sarana parkir mundur',
            },
            {
                key: 'situasi_7',
                label: '7. Terdapat rambu tempat berkumpul darurat',
            },
        ],
    },
    {
        key: 'individu',
        label: 'Individu',
        items: [
            {
                key: 'individu_1',
                label: '8. Semua karyawan memakai APD sesuai standar',
            },
        ],
    },
    {
        key: 'alat',
        label: 'Alat',
        items: [
            {
                key: 'alat_1',
                label: '9. Rambu K3 (safety sign) lengkap dan memadai',
            },
            {
                key: 'alat_2',
                label: '10. Instalasi listrik, saklar, kabel dalam kondisi baik dan aman',
            },
            {
                key: 'alat_3',
                label: '11. Semua pipa, kran dan katup dalam kondisi baik',
            },
            {
                key: 'alat_4',
                label: '12. Pada pintu ruangan khusus terdapat rambu "Dilarang Masuk selain Petugas"',
            },
            {
                key: 'alat_5',
                label: '13. Bangunan dilengkapi alarm emergency & Rambu Evakuasi',
            },
            {
                key: 'alat_6',
                label: '14. Semua furniture (lemari, meja kerja, kursi dll) dalam kondisi baik, bersih dan ergonomis',
            },
            {
                key: 'alat_7',
                label: '15. Terdapat APAR atau instalasi hydran dalam kondisi baik',
            },
        ],
    },
    {
        key: 'prosedur',
        label: 'Prosedur',
        items: [
            {
                key: 'prosedur_1',
                label: '16. Tempat sampah mencukupi, dan dikosongkan setiap hari',
            },
            {
                key: 'prosedur_2',
                label: '17. APAR tersedia memadai dan diinspeksi secara rutin',
            },
            {
                key: 'prosedur_3',
                label: '18. Bangunan dilengkapi dengan sistem pentanahan dan dilakukan inspeksi/pengukuran secara rutin',
            },
            {
                key: 'prosedur_4',
                label: '19. Kotak P3K lengkap dengan peralatannya',
            },
            {
                key: 'prosedur_5',
                label: '20. Tidak menyimpan Cairan Mudah Terbakar/menyala di dalam ruang kerja',
            },
            {
                key: 'prosedur_6',
                label: '21. Penyimpanan & Pengendalian Bahan Kimia Berbahaya',
            },
            {
                key: 'prosedur_7',
                label: '22. Terdapat Papan Pengumuman K3 & LH',
            },
        ],
    },
] as const;

const TAMBANG_CATEGORIES = [
    {
        key: 'situasi',
        label: 'Situasi',
        items: [
            {
                key: 'situasi_1',
                label: '1. House Keeping/kebersihan lingkungan memadai/bebas dari sampah dan bahan bekas lainnya',
            },
            {
                key: 'situasi_2',
                label: '2. Jalan angkut rata (tidak bergelombang) dan bebas dari batuan lepas',
            },
            {
                key: 'situasi_3',
                label: '3. Lebar jalan angkut sesuai dengan standar (2x lebar kendaraan terbesar untuk jalan satu arah atau 3.5x untuk jalan 2 arah)',
            },
            {
                key: 'situasi_4',
                label: '4. Semua jalan angkut dilengkapi dengan tanggul pengaman sesuai standar; Tanggul dilengkapi dengan post guide dan terdapat parit/drainage',
            },
            {
                key: 'situasi_5',
                label: '5. Dinding galian dalam keadaan stabil, tidak terdapat keretakan',
            },
            {
                key: 'situasi_6',
                label: '6. Tidak terdapat material longsor atau material yang menggantung di atas dinding galian',
            },
            {
                key: 'situasi_7',
                label: '7. Ketinggian dan kemiringan slope sesuai dengan standar dan bebas dari batuan lepas',
            },
            {
                key: 'situasi_8',
                label: '8. Tempat pembuangan/dumping rata, tidak ada batu besar dan lumpur',
            },
            {
                key: 'situasi_9',
                label: '9. Dumping area tidak terdapat keretakan; dilengkapi dengan tanggul pengaman yang memadai',
            },
            {
                key: 'situasi_10',
                label: '10. Lampu penerangan mencukupi untuk semua area untuk shift malam',
            },
            {
                key: 'situasi_11',
                label: '11. Semua lampu penerangan berada pada tempat yang aman dan dilindungi dengan tanggul pengaman yang memadai',
            },
            {
                key: 'situasi_12',
                label: '12. Semua karyawan berada pada tempat yang aman',
            },
            {
                key: 'situasi_13',
                label: '13. Semua kendaraan sarana diparkir pada tempat yang aman',
            },
        ],
    },
    {
        key: 'individu',
        label: 'Individu',
        items: [
            {
                key: 'individu_1',
                label: '14. Semua Karyawan memakai APD yang sesuai',
            },
            {
                key: 'individu_2',
                label: '15. Semua operator dan driver mempunyai SIMPER yang sesuai (random Sampling)',
            },
        ],
    },
    {
        key: 'alat',
        label: 'Alat',
        items: [
            {
                key: 'alat_1',
                label: '16. Rambu-rambu lalu lintas dengan ukuran yang memadai dan terlihat jelas dengan jarak 50m',
            },
            {
                key: 'alat_2',
                label: '17. Semua equipment dan kendaraan bersih, lampu-lampu peringatan berfungsi dengan baik',
            },
            {
                key: 'alat_3',
                label: '18. Terdapat rambu penunjuk arah keluar dan masuk PIT; Terdapat rambu evakuasi ke arah titik pengungsian/Muster point',
            },
            {
                key: 'alat_4',
                label: '19. Drainase atau saluran air berfungsi dengan baik',
            },
            {
                key: 'alat_5',
                label: '20. Semua kendaraan sarana untuk pengawas dilengkapi dengan kotak P3K',
            },
            {
                key: 'alat_6',
                label: '21. Tersedia APAR di semua unit dan tersedia 1 unit water truck yang dapat berfungsi sebagai unit pemadam kebakaran',
            },
        ],
    },
    {
        key: 'prosedur',
        label: 'Prosedur',
        items: [
            {
                key: 'prosedur_1',
                label: '22. Pengendalian Debu: debu terkendali, terdapat jadwal penyiraman dan jumlah water truck mencukupi',
            },
            {
                key: 'prosedur_2',
                label: '23. Bench dilengkapi dengan safety berm yang memadai',
            },
            {
                key: 'prosedur_3',
                label: '24. Semua kendaraan sarana dengan ketinggian kurang dari 4 meter dilengkapi dengan buggy whip yang tingginya 4 meter dari tanah',
            },
            {
                key: 'prosedur_4',
                label: '25. Semua operator dan driver melakukan pre-start Check / P2H (random sampling)',
            },
            {
                key: 'prosedur_5',
                label: '26. Semua operator dan driver memakai seat belt (random sampling)',
            },
        ],
    },
] as const;

const WORKSHOP_CATEGORIES = [
    {
        key: 'bangunan',
        label: 'Bangunan / Fasilitas',
        items: [
            {
                key: 'bangunan_1',
                label: '1. Atap/dinding tidak bocor/rusak/tidak aman',
            },
            {
                key: 'bangunan_2',
                label: '2. Lantai kering, bersih, dan tidak licin',
            },
            {
                key: 'bangunan_3',
                label: '3. Jalan keluar masuk bebas hambatan',
            },
            {
                key: 'bangunan_4',
                label: '4. Pintu darurat berfungsi dan tidak terhalang',
            },
            {
                key: 'bangunan_5',
                label: '5. Ventilasi dan pencahayaan mencukupi',
            },
            {
                key: 'bangunan_6',
                label: '6. Tangga/platform dalam kondisi aman',
            },
            {
                key: 'bangunan_7',
                label: '7. Rambu keselamatan terpasang dan terlihat jelas',
            },
            { key: 'bangunan_8', label: '8. Kebersihan area kerja terjaga' },
            {
                key: 'bangunan_9',
                label: '9. Area penyimpanan bahan kimia aman dan berlabel',
            },
            {
                key: 'bangunan_10',
                label: '10. Tempat sampah tersedia dan terpisah sesuai jenis',
            },
            {
                key: 'bangunan_11',
                label: '11. Fasilitas P3K tersedia dan lengkap',
            },
            {
                key: 'bangunan_12',
                label: '12. Jalur evakuasi ditandai dengan jelas',
            },
            { key: 'bangunan_13', label: '13. Titik kumpul evakuasi jelas' },
            {
                key: 'bangunan_14',
                label: '14. Peralatan kerja disimpan dengan tertata rapi',
            },
            {
                key: 'bangunan_15',
                label: '15. Bahan mudah terbakar tersimpan di tempat aman',
            },
            {
                key: 'bangunan_16',
                label: '16. Material tidak berserakan di area kerja',
            },
            {
                key: 'bangunan_17',
                label: '17. MSDS/SDS tersedia untuk semua bahan kimia',
            },
            {
                key: 'bangunan_18',
                label: '18. Tanda larangan merokok terpasang di tempat yang tepat',
            },
            { key: 'bangunan_19', label: '19. Area non-smoking dipatuhi' },
            {
                key: 'bangunan_20',
                label: '20. Toilet/kamar mandi bersih dan berfungsi',
            },
            {
                key: 'bangunan_21',
                label: '21. Air bersih tersedia untuk cuci tangan',
            },
        ],
    },
    {
        key: 'kelistrikan',
        label: 'Instalasi Kelistrikan',
        items: [
            {
                key: 'kelistrikan_1',
                label: '22. Panel listrik dalam kondisi tertutup dan berlabel',
            },
            {
                key: 'kelistrikan_2',
                label: '23. Kabel tidak berserakan atau terkelupas',
            },
            {
                key: 'kelistrikan_3',
                label: '24. Stop kontak/saklar tidak rusak',
            },
            {
                key: 'kelistrikan_4',
                label: '25. Grounding/earthing peralatan listrik berfungsi',
            },
            {
                key: 'kelistrikan_5',
                label: '26. Tidak ada overloading pada instalasi listrik',
            },
            {
                key: 'kelistrikan_6',
                label: '27. Lampu penerangan berfungsi dengan baik',
            },
            {
                key: 'kelistrikan_7',
                label: '28. Genset/UPS dalam kondisi baik jika ada',
            },
            {
                key: 'kelistrikan_8',
                label: '29. Peralatan listrik portabel dalam kondisi aman',
            },
        ],
    },
    {
        key: 'welder',
        label: 'Area Pengelasan (Welder)',
        items: [
            {
                key: 'welder_1',
                label: '30. APD las (helm, sarung tangan, apron) tersedia dan layak',
            },
            { key: 'welder_2', label: '31. Tirai/welding curtain terpasang' },
            {
                key: 'welder_3',
                label: '32. Ventilasi memadai di area pengelasan',
            },
            {
                key: 'welder_4',
                label: '33. Peralatan las dalam kondisi baik dan aman',
            },
            {
                key: 'welder_5',
                label: '34. Tidak ada bahan mudah terbakar di sekitar area las',
            },
            {
                key: 'welder_6',
                label: '35. Izin kerja las (hot work permit) tersedia jika diperlukan',
            },
        ],
    },
    {
        key: 'tabung',
        label: 'Tabung Gas',
        items: [
            {
                key: 'tabung_1',
                label: '36. Tabung gas berdiri tegak dan terikat/terpasang aman',
            },
            {
                key: 'tabung_2',
                label: '37. Tutup/cap tabung gas terpasang saat tidak digunakan',
            },
            {
                key: 'tabung_3',
                label: '38. Regulator dan selang gas dalam kondisi baik',
            },
            {
                key: 'tabung_4',
                label: '39. Tabung gas tidak bocor (dilakukan pengecekan)',
            },
            {
                key: 'tabung_5',
                label: '40. Tabung gas penuh dan kosong dipisahkan',
            },
            {
                key: 'tabung_6',
                label: '41. Label tabung gas (isi, kosong, rusak) jelas',
            },
        ],
    },
    {
        key: 'alat_angkat',
        label: 'Alat Angkat / Rigging',
        items: [
            {
                key: 'alat_angkat_1',
                label: '42. Sling/rantai angkat dalam kondisi baik, tidak rusak',
            },
            {
                key: 'alat_angkat_2',
                label: '43. Kapasitas angkat alat tertera dengan jelas',
            },
            {
                key: 'alat_angkat_3',
                label: '44. Hoist/crane diperiksa secara berkala (ada stiker inspeksi)',
            },
            {
                key: 'alat_angkat_4',
                label: '45. Operator alat angkat berkompetensi/bersertifikat',
            },
            {
                key: 'alat_angkat_5',
                label: '46. Area pengangkatan dibebaskan dari personel yang tidak berkepentingan',
            },
        ],
    },
    {
        key: 'tps',
        label: 'Tempat Penyimpanan (TPS)',
        items: [
            {
                key: 'tps_1',
                label: '47. Rak/shelving kokoh dan tidak overload',
            },
            {
                key: 'tps_2',
                label: '48. Barang berat di bawah, ringan di atas',
            },
            {
                key: 'tps_3',
                label: '49. Material bertumpuk tidak melebihi batas aman',
            },
            {
                key: 'tps_4',
                label: '50. Label/identifikasi material terpasang jelas',
            },
            {
                key: 'tps_5',
                label: '51. Jalur akses penyimpanan bebas hambatan',
            },
            {
                key: 'tps_6',
                label: '52. Limbah B3 tersimpan di TPS khusus dan berlabel',
            },
            {
                key: 'tps_7',
                label: '53. Manifest limbah B3 tersedia dan updated',
            },
            { key: 'tps_8', label: '54. Oli bekas tersimpan di drum tertutup' },
            { key: 'tps_9', label: '55. Spill kit tersedia di dekat area TPS' },
            {
                key: 'tps_10',
                label: '56. Bunding/secondary containment untuk bahan kimia tersedia',
            },
            {
                key: 'tps_11',
                label: '57. APAR tersedia dan mudah dijangkau di area TPS',
            },
            {
                key: 'tps_12',
                label: '58. Inspeksi APAR dilakukan secara rutin (kartu inspeksi ada)',
            },
        ],
    },
    {
        key: 'tyre',
        label: 'Area Tyre / Ban',
        items: [
            {
                key: 'tyre_1',
                label: '59. Ban tersimpan dengan aman (tidak berpotensi menggelinding)',
            },
            {
                key: 'tyre_2',
                label: '60. Peralatan pengisian angin (kompresor, selang) aman',
            },
            {
                key: 'tyre_3',
                label: '61. APD tersedia untuk pekerjaan tyre (sarung tangan, pelindung wajah)',
            },
        ],
    },
] as const;

const MESS_CATEGORIES = [
    {
        key: 'sanitasi',
        label: 'Sanitasi & Kebersihan Umum',
        items: [
            {
                key: 'sanitasi_1',
                label: '1. Lingkungan mess bersih, bebas sampah berserakan',
            },
            {
                key: 'sanitasi_2',
                label: '2. Saluran air/drainase tidak tersumbat dan berfungsi baik',
            },
            {
                key: 'sanitasi_3',
                label: '3. Tersedia tempat sampah yang cukup dan terpilah',
            },
            {
                key: 'sanitasi_4',
                label: '4. Sampah diangkut/dibuang secara rutin',
            },
            {
                key: 'sanitasi_5',
                label: '5. Tidak ada genangan air yang berpotensi jadi sarang nyamuk',
            },
            {
                key: 'sanitasi_6',
                label: '6. Toilet/kamar mandi bersih, tidak berbau, dan berfungsi',
            },
            {
                key: 'sanitasi_7',
                label: '7. Air bersih tersedia 24 jam dan cukup untuk penghuni',
            },
            {
                key: 'sanitasi_8',
                label: '8. Sabun dan perlengkapan kebersihan tersedia di kamar mandi',
            },
            {
                key: 'sanitasi_9',
                label: '9. Area cuci pakaian bersih dan drainasenya baik',
            },
            {
                key: 'sanitasi_10',
                label: '10. Hewan pengganggu (tikus, kecoa, nyamuk) dikendalikan',
            },
        ],
    },
    {
        key: 'kamar',
        label: 'Kamar Tidur & Fasilitas Pribadi',
        items: [
            {
                key: 'kamar_1',
                label: '11. Kamar tidur bersih, rapi, dan berventilasi baik',
            },
            {
                key: 'kamar_2',
                label: '12. Kapasitas kamar tidak melebihi batas yang ditentukan',
            },
            {
                key: 'kamar_3',
                label: '13. Tempat tidur dalam kondisi layak dan bersih',
            },
            {
                key: 'kamar_4',
                label: '14. Lemari/loker penyimpanan tersedia dan memadai',
            },
            { key: 'kamar_5', label: '15. Pencahayaan kamar mencukupi' },
            {
                key: 'kamar_6',
                label: '16. AC/kipas angin berfungsi dengan baik',
            },
            {
                key: 'kamar_7',
                label: '17. Tidak ada kerusakan pada pintu, jendela, atau kunci kamar',
            },
            {
                key: 'kamar_8',
                label: '18. Area koridor/lorong bersih dan bebas hambatan',
            },
        ],
    },
    {
        key: 'dapur',
        label: 'Dapur & Area Makan',
        items: [
            {
                key: 'dapur_1',
                label: '19. Dapur bersih, peralatan masak dalam kondisi baik',
            },
            {
                key: 'dapur_2',
                label: '20. Makanan tersimpan dengan benar (tertutup, suhu tepat)',
            },
            {
                key: 'dapur_3',
                label: '21. Kulkas/freezer berfungsi baik dan bersih',
            },
            {
                key: 'dapur_4',
                label: '22. Area makan bersih dan meja makan layak',
            },
            {
                key: 'dapur_5',
                label: '23. Tidak ada kontaminasi silang antara makanan mentah dan matang',
            },
        ],
    },
    {
        key: 'sampah',
        label: 'Pengelolaan Sampah & Lingkungan',
        items: [
            {
                key: 'sampah_1',
                label: '24. TPS sampah mess tertutup dan tidak menimbulkan bau',
            },
            {
                key: 'sampah_2',
                label: '25. Jadwal pengangkutan sampah ada dan dipatuhi',
            },
            {
                key: 'sampah_3',
                label: '26. Tidak ada pembakaran sampah di area mess',
            },
            {
                key: 'sampah_4',
                label: '27. Taman/area hijau di sekitar mess terawat',
            },
            {
                key: 'sampah_5',
                label: '28. Fasilitas olahraga/rekreasi (jika ada) aman dan terawat',
            },
        ],
    },
] as const;

export const INSPEKSI: Record<InspeksiKind, InspeksiConfig> = {
    kantor: {
        kind: 'kantor',
        title: 'Inspeksi Area Kantor',
        formCode: 'WBK-HSE-FO-004',
        categories: KANTOR_CATEGORIES,
        fields: [
            {
                key: 'departemen',
                label: 'Departemen',
                placeholder: 'Nama departemen',
                required: true,
            },
        ],
    },
    tambang: {
        kind: 'tambang',
        title: 'Inspeksi Area Tambang',
        formCode: 'WBK-HSE-FO-005',
        categories: TAMBANG_CATEGORIES,
        fields: [
            {
                key: 'departemen',
                label: 'Departemen',
                placeholder: 'Nama departemen',
                required: true,
            },
            {
                key: 'lokasi',
                label: 'Lokasi',
                placeholder: 'Contoh: Pit Alam 8-9',
                format: formatLokasi,
            },
        ],
    },
    workshop: {
        kind: 'workshop',
        title: 'Inspeksi Area Workshop',
        formCode: 'WBK-HSE-FO-007',
        categories: WORKSHOP_CATEGORIES,
        fields: [
            {
                key: 'departemen',
                label: 'Departemen',
                placeholder: 'Nama departemen',
                required: true,
            },
        ],
    },
    mess: {
        kind: 'mess',
        title: 'Inspeksi Area Mess',
        formCode: 'WBK-HSE-FO-038',
        categories: MESS_CATEGORIES,
        fields: [
            {
                key: 'lokasi',
                label: 'Lokasi mess',
                placeholder: 'Nama / lokasi mess',
                required: true,
            },
        ],
    },
};
