-- Scratch Challenge Seed Data
-- Indonesian language content for elementary/middle school students

-- Insert categories
INSERT INTO categories (id, name, slug, description, icon_name, color_class, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Basic', 'basic', 'Motion, Looks, Sound', 'BookOpen', 'bg-blue-100 text-blue-700', 1),
('22222222-2222-2222-2222-222222222222', 'Event', 'event', 'When Flag Clicked, Broadcast', 'Zap', 'bg-yellow-100 text-yellow-700', 2),
('33333333-3333-3333-3333-333333333333', 'Condition', 'condition', 'If, If Else, Nested If', 'GitBranch', 'bg-purple-100 text-purple-700', 3),
('44444444-4444-4444-4444-444444444444', 'Loop', 'loop', 'Repeat, Forever, Repeat Until', 'RefreshCw', 'bg-green-100 text-green-700', 4),
('55555555-5555-5555-5555-555555555555', 'Variable', 'variable', 'Set Variable, Change Variable', 'Database', 'bg-orange-100 text-orange-700', 5),
('66666666-6666-6666-6666-666666666666', 'Logic', 'logic', 'AND, OR, NOT', 'Braces', 'bg-pink-100 text-pink-700', 6),
('77777777-7777-7777-7777-777777777777', 'Advanced', 'advanced', 'Game Logic, Collision, Score System', 'Trophy', 'bg-red-100 text-red-700', 7);

-- Insert exercises
INSERT INTO exercises (id, category_id, title, slug, short_description, case_description, problem_statement, instructions, learning_objectives, difficulty, estimated_minutes, thumbnail_url, scratch_file_url, scratch_file_name, scratch_file_type, video_url, video_type, status, sort_order) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Tangkap Buah',
    'tangkap-buah',
    'Buat game menangkap buah yang jatuh dengan keranjang',
    '<h3>Latar Belakang Cerita</h3>
<p>Si Kucing lapar dan ingin makan buah-buahan yang enak. Buah-buahan jatuh dari langit dan Si Kucing harus menangkapnya menggunakan keranjang ajaibnya!</p>

<h3>Permasalahan</h3>
<p>Bagaimana membuat keranjang bergerak menggunakan keyboard dan menambahkan skor ketika buah berhasil ditangkap?</p>

<h3>Instruksi Pengerjaan</h3>
<ol>
<li>Keranjang dapat bergerak ke kiri menggunakan tombol panah kiri.</li>
<li>Keranjang dapat bergerak ke kanan menggunakan tombol panah kanan.</li>
<li>Buah jatuh dari posisi acak di bagian atas layar.</li>
<li>Jika buah menyentuh keranjang, skor bertambah 1.</li>
<li>Buah kembali muncul dari atas setelah berhasil ditangkap.</li>
</ol>

<h3>Ketentuan</h3>
<ul>
<li>Gunakan event "when flag clicked" untuk memulai game.</li>
<li>Gunakan loop "forever" untuk membuat buah jatuh terus-menerus.</li>
<li>Gunakan kondisi "if" untuk mendeteksi tabrakan buah dengan keranjang.</li>
<li>Gunakan variabel "skor" untuk menghitung poin.</li>
</ul>

<h3>Expected Behavior</h3>
<p>Game berjalan lancar: keranjang bergerak mengikuti tombol panah, buah jatuh dari atas secara acak, skor bertambah saat buah tertangkap, dan buah muncul kembali dari atas.</p>

<h3>Petunjuk Tambahan</h3>
<ul>
<li>Gunakan blok "go to x: (random -200 to 200) y: 180" untuk posisi acak buah.</li>
<li>Gunakan blok "change y by -5" untuk membuat buah jatuh.</li>
<li>Gunakan blok "touching [keranjang v]?" untuk deteksi tabrakan.</li>
</ul>',
    'Bagaimana membuat keranjang bergerak menggunakan keyboard dan menambahkan skor ketika buah berhasil ditangkap?',
    '["Keranjang dapat bergerak ke kiri menggunakan tombol panah kiri.", "Keranjang dapat bergerak ke kanan menggunakan tombol panah kanan.", "Buah jatuh dari posisi acak di bagian atas layar.", "Jika buah menyentuh keranjang, skor bertambah 1.", "Buah kembali muncul dari atas setelah berhasil ditangkap."]',
    '["Event: When Flag Clicked", "Motion: Go to, Change X, Change Y", "Forever Loop", "If Condition", "Variable: Set, Change"]',
    'beginner',
    30,
    '/thumbnails/tangkap-buah.png',
    '/projects/tangkap-buah-starter.sb3',
    'tangkap-buah-starter.sb3',
    'starter',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    'published',
    1
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Petualangan Kucing',
    'petualangan-kucing',
    'Bantu kucing melewati rintangan untuk menemukan ikan',
    '<h3>Latar Belakang Cerita</h3>
<p>Si Kucing sedang dalam petualangan mencari ikan favoritnya. Dia harus melewati berbagai rintangan seperti batu, lubang, dan musuh untuk sampai ke ikan!</p>

<h3>Permasalahan</h3>
<p>Bagaimana membuat karakter bergerak dan melompat saat tombol ditekan, serta mendeteksi tabrakan dengan rintangan?</p>

<h3>Instruksi Pengerjaan</h3>
<ol>
<li>Kucing bergerak ke kiri/kanan dengan tombol panah.</li>
<li>Kucing melompat dengan tombol spasi.</li>
<li>Jika kucing menyentuh rintangan, kembali ke posisi awal.</li>
<li>Jika kucing menyentuh ikan, tampilkan pesan "Selamat!" dan game selesai.</li>
</ol>

<h3>Ketentuan</h3>
<ul>
<li>Gunakan event "when flag clicked" dan "when key pressed".</li>
<li>Gunakan broadcast untuk komunikasi antar sprite.</li>
<li>Gunakan kondisi untuk mendeteksi tabrakan.</li>
</ul>

<h3>Expected Behavior</h3>
<p>Kucing bergerak mulus, melompat realistis, tabrakan terdeteksi dengan benar, dan pesan kemenangan muncul saat menyentuh ikan.</p>

<h3>Petunjuk Tambahan</h3>
<ul>
<li>Gunakan "when key pressed [right arrow v]" untuk gerakan kanan.</li>
<li>Gunakan "broadcast [lompat v]" untuk melompat.</li>
<li>Gunakan "touching [rintangan v]?" untuk deteksi tabrakan.</li>
</ul>',
    'Bagaimana membuat karakter bergerak dan melompat saat tombol ditekan, serta mendeteksi tabrakan dengan rintangan?',
    '["Kucing bergerak ke kiri/kanan dengan tombol panah.", "Kucing melompat dengan tombol spasi.", "Jika kucing menyentuh rintangan, kembali ke posisi awal.", "Jika kucing menyentuh ikan, tampilkan pesan \"Selamat!\" dan game selesai."]',
    '["Event: When Flag Clicked, When Key Pressed", "Broadcast Message", "Motion: Glide, Change Y", "If Condition", "Sensing: Touching"]',
    'beginner',
    45,
    '/thumbnails/petualangan-kucing.png',
    '/projects/petualangan-kucing-starter.sb3',
    'petualangan-kucing-starter.sb3',
    'starter',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    'published',
    2
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'Tebak Angka',
    'tebak-angka',
    'Buat game tebak angka dengan logika kondisi',
    '<h3>Latar Belakang Cerita</h3>
<p>Komputer memilih angka rahasia antara 1-100. Kamu harus menebaknya! Komputer akan memberitahu apakah tebakanmu terlalu besar, terlalu kecil, atau benar.</p>

<h3>Permasalahan</h3>
<p>Bagaimana menggunakan logika kondisi (if-else) untuk membandingkan tebakan pemain dengan angka rahasia?</p>

<h3>Instruksi Pengerjaan</h3>
<ol>
<li>Komputer memilih angka acak 1-100 di awal game.</li>
<li>Pemain memasukkan tebakan menggunakan input (ask).</li>
<li>Jika tebakan > angka rahasia: tampilkan "Terlalu besar!".</li>
<li>Jika tebakan < angka rahasia: tampilkan "Terlalu kecil!".</li>
<li>Jika tebakan = angka rahasia: tampilkan "Benar!" dan hentikan game.</li>
<li>Hitung jumlah percobaan.</li>
</ol>

<h3>Ketentuan</h3>
<ul>
<li>Gunakan variabel untuk menyimpan angka rahasia dan jumlah percobaan.</li>
<li>Gunakan nested if-else (if di dalam if) untuk logika perbandingan.</li>
<li>Gunakan loop "repeat until" untuk mengulang sampai benar.</li>
</ul>

<h3>Expected Behavior</h3>
<p>Game meminta input berulang, memberikan petunjuk benar (terlalu besar/kecil), menghentikan saat benar, dan menampilkan jumlah percobaan.</p>

<h3>Petunjuk Tambahan</h3>
<ul>
<li>Gunakan "pick random 1 to 100" untuk angka rahasia.</li>
<li>Gunakan "ask [Tebak angka 1-100:] and wait" untuk input.</li>
<li>Gunakan "answer" untuk mendapatkan input pemain.</li>
</ul>',
    'Bagaimana menggunakan logika kondisi (if-else) untuk membandingkan tebakan pemain dengan angka rahasia?',
    '["Komputer memilih angka acak 1-100 di awal game.", "Pemain memasukkan tebakan menggunakan input (ask).", "Jika tebakan > angka rahasia: tampilkan \"Terlalu besar!\".", "Jika tebakan < angka rahasia: tampilkan \"Terlalu kecil!\".", "Jika tebakan = angka rahasia: tampilkan \"Benar!\" dan hentikan game.", "Hitung jumlah percobaan."]',
    '["Variable: Set, Change", "If Else Condition", "Nested If", "Repeat Until Loop", "Operators: >, <, =", "Ask and Wait"]',
    'intermediate',
    40,
    '/thumbnails/tebak-angka.png',
    '/projects/tebak-angka-starter.sb3',
    'tebak-angka-starter.sb3',
    'starter',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    'published',
    3
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '55555555-5555-5555-5555-555555555555',
    'Balap Mobil',
    'balap-mobil',
    'Buat game balap mobil dengan sistem skor',
    '<h3>Latar Belakang Cerita</h3>
<p>Kamu adalah pengemudi balap profesional! Kendarai mobilmu melewati lintasan, hindari rintangan, dan kumpulkan koin untuk skor tertinggi.</p>

<h3>Permasalahan</h3>
<p>Bagaimana membuat sistem skor, nyawa, dan level menggunakan variabel, serta membuat rintangan bergerak otomatis?</p>

<h3>Instruksi Pengerjaan</h3>
<ol>
<li>Mobil bergerak kiri/kanan dengan tombol panah.</li>
<li>Rintangan (mobil lain) muncul dari atas dan bergerak ke bawah.</li>
<li>Koin muncul acak untuk dikumpulkan.</li>
<li>Tabrakan dengan rintangan: nyawa berkurang 1.</li>
<li>Mengambil koin: skor bertambah 10.</li>
<li>Nyawa habis: Game Over, tampilkan skor akhir.</li>
<li>Level naik setiap 100 skor: rintangan lebih cepat.</li>
</ol>

<h3>Ketentuan</h3>
<ul>
<li>Gunakan variabel: skor, nyawa, level, kecepatan_rintangan.</li>
<li>Gunakan clone untuk membuat banyak rintangan dan koin.</li>
<li>Gunakan broadcast untuk reset game.</li>
</ul>

<h3>Expected Behavior</h3>
<p>Mobil player kontrol lancar, rintangan spawn otomatis bertingkat kecepatan, koin kolektable, sistem nyawa dan skor berfungsi, game over saat nyawa 0.</p>

<h3>Petunjuk Tambahan</h3>
<ul>
<li>Gunakan "create clone of [myself v]" untuk spawn rintangan.</li>
<li>Gunakan "when I start as a clone" untuk logika rintangan individual.</li>
<li>Gunakan "delete this clone" saat rintangan keluar layar.</li>
</ul>',
    'Bagaimana membuat sistem skor, nyawa, dan level menggunakan variabel, serta membuat rintangan bergerak otomatis?',
    '["Mobil bergerak kiri/kanan dengan tombol panah.", "Rintangan (mobil lain) muncul dari atas dan bergerak ke bawah.", "Koin muncul acak untuk dikumpulkan.", "Tabrakan dengan rintangan: nyawa berkurang 1.", "Mengambil koin: skor bertambah 10.", "Nyawa habis: Game Over, tampilkan skor akhir.", "Level naik setiap 100 skor: rintangan lebih cepat."]',
    '["Variable: Set, Change", "Clone: Create, Delete", "Forever Loop", "If Condition", "Operators: +, -, *", "Broadcast"]',
    'intermediate',
    60,
    '/thumbnails/balap-mobil.png',
    '/projects/balap-mobil-starter.sb3',
    'balap-mobil-starter.sb3',
    'starter',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    'published',
    4
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '77777777-7777-7777-7777-777777777777',
    'Space Shooter',
    'space-shooter',
    'Buat game tembak-tembakan ruang angkasa',
    '<h3>Latar Belakang Cerita</h3>
<p>Kamu adalah pilot pesawat luar angkasa! Hancurkan musuh-musuh alien, hindari peluru mereka, dan bertahan sejauh mungkin untuk skor tertinggi.</p>

<h3>Permasalahan</h3>
<p>Bagaimana membuat sistem tembakan, musuh dengan AI sederhana, power-up, dan multiple sprite interaction?</p>

<h3>Instruksi Pengerjaan</h3>
<ol>
<li>Pesawat player bergerak mouse/keyboard, menembak dengan spasi/klik.</li>
<li>Musuh spawn dari atas, bergerak ke bawah, menembak acak.</li>
<li>Peluru player hancurkan musuh: skor +50, musuh hilang + efek ledakan.</li>
<li>Peluru musuh kena player: nyawa -1.</li>
<li>Power-up (shield, rapid fire, extra life) drop acak dari musuh.</li>
<li>Boss muncul setiap 500 skor: butuh 10 hit, gerak kompleks.</li>
<li>Game Over: tampilkan high score (simpan di variabel cloud/local).</li>
</ol>

<h3>Ketentuan</h3>
<ul>
<li>Gunakan clone untuk peluru player dan musuh.</li>
<li>Gunakan variabel untuk skor, nyawa, level, boss_hp.</li>
<li>Gunakan list untuk menyimpan high score.</li>
<li>Gunakan broadcast untuk event: spawn_enemy, powerup_drop, boss_spawn.</li>
</ul>

<h3>Expected Behavior</h3>
<p>Gameplay cepat dan responsif, banyak sprite berinteraksi (player, musuh, peluru, power-up, boss), sistem skor/nyawa/level berfungsi, boss battle menantang.</p>

<h3>Petunjuk Tambahan</h3>
<ul>
<li>Gunakan "point towards [mouse-pointer v]" untuk aim peluru.</li>
<li>Gunakan "glide" untuk gerakan musuh yang smooth.</li>
<li>Gunakan "pick random" untuk variasi spawn dan tembakan musuh.</li>
</ul>',
    'Bagaimana membuat sistem tembakan, musuh dengan AI sederhana, power-up, dan multiple sprite interaction?',
    '["Pesawat player bergerak mouse/keyboard, menembak dengan spasi/klik.", "Musuh spawn dari atas, bergerak ke bawah, menembak acak.", "Peluru player hancurkan musuh: skor +50, musuh hilang + efek ledakan.", "Peluru musuh kena player: nyawa -1.", "Power-up (shield, rapid fire, extra life) drop acak dari musuh.", "Boss muncul setiap 500 skor: butuh 10 hit, gerak kompleks.", "Game Over: tampilkan high score."]',
    '["Clone Management", "Variable: Multiple", "List: High Score", "Broadcast Messages", "Complex If-Else Logic", "Operators: Math, Random", "Mouse/Keyboard Input"]',
    'advanced',
    90,
    '/thumbnails/space-shooter.png',
    '/projects/space-shooter-starter.sb3',
    'space-shooter-starter.sb3',
    'starter',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    'published',
    5
),
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '66666666-6666-6666-6666-666666666666',
    'Memory Game',
    'memory-game',
    'Buat game memori dengan kartu yang harus dipasangkan',
    '<h3>Latar Belakang Cerita</h3>
<p>Uji ingatanmu dengan game memory klasik! Buka kartu dua dua, cari pasangannya, dan selesaikan semuanya secepat mungkin.</p>

<h3>Permasalahan</h3>
<p>Bagaimana menggunakan list (array) untuk mengacak kartu, melacak kartu yang dibuka, dan memeriksa kecocokan pasangan?</p>

<h3>Instruksi Pengerjaan</h3>
<ol>
<li>Buat 8 pasang kartu (16 kartu total) dengan gambar berbeda.</li>
<li>Acak posisi kartu di awal game menggunakan list.</li>
<li>Kartu awalnya tertutup (tampilkan back).</li>
<li>Klik kartu untuk membuka (tampilkan front).</li>
<li>Buka 2 kartu: jika sama -> tetap terbuka, skor +10. Jika beda -> tutup lagi setelah 1 detik.</li>
<li>Semua pasangan ditemukan: Game Win, tampilkan waktu dan skor.</li>
<li>Tambahkan timer mundur (countdown) 60 detik.</li>
</ol>

<h3>Ketentuan</h3>
<ul>
<li>Gunakan list untuk menyimpan ID kartu dan posisi.</li>
<li>Gunakan variabel: kartu_terbuka_1, kartu_terbuka_2, skor, waktu, pasangan_ditemukan.</li>
<li>Gunakan clone untuk 16 kartu dengan costume berbeda.</li>
<li>Gunakan "wait 1 secs" untuk delay menutup kartu tidak cocok.</li>
</ul>

<h3>Expected Behavior</h3>
<p>Kartu acak tiap game, buka/tutup animasi smooth, logika cocok/tidak cocok benar, timer berjalan, win condition terdeteksi.</p>

<h3>Petunjuk Tambahan</h3>
<ul>
<li>Gunakan "add [item] to [list v]" untuk mengisi list kartu.</li>
<li>Gunakan "replace item [index] of [list v] with [value]" untuk shuffle.</li>
<li>Gunakan "item [index] of [list v]" untuk cek pasangan.</li>
</ul>',
    'Bagaimana menggunakan list (array) untuk mengacak kartu, melacak kartu yang dibuka, dan memeriksa kecocokan pasangan?',
    '["Buat 8 pasang kartu (16 kartu total) dengan gambar berbeda.", "Acak posisi kartu di awal game menggunakan list.", "Kartu awalnya tertutup (tampilkan back).", "Klik kartu untuk membuka (tampilkan front).", "Buka 2 kartu: jika sama -> tetap terbuka, skor +10. Jika beda -> tutup lagi setelah 1 detik.", "Semua pasangan ditemukan: Game Win, tampilkan waktu dan skor.", "Tambahkan timer mundur (countdown) 60 detik."]',
    '["List: Add, Replace, Item, Length", "Clone: Create, Switch Costume", "Variable: Multiple", "Timer/Countdown", "If Else Logic", "Random Shuffle Algorithm"]',
    'advanced',
    75,
    '/thumbnails/memory-game.png',
    '/projects/memory-game-starter.sb3',
    'memory-game-starter.sb3',
    'starter',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    'published',
    6
);

-- Insert checklists for each exercise
-- Tangkap Buah
INSERT INTO exercise_checklists (exercise_id, description, sort_order) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Keranjang bergerak ke kiri dan kanan', 1),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Buah jatuh secara otomatis', 2),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Skor bertambah ketika buah tertangkap', 3),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Buah muncul kembali setelah tertangkap', 4);

-- Petualangan Kucing
INSERT INTO exercise_checklists (exercise_id, description, sort_order) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kucing bergerak kiri/kanan dengan tombol panah', 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kucing melompat dengan tombol spasi', 2),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tabrakan rintangan mengembalikan ke awal', 3),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Menyentuh ikan menampilkan pesan kemenangan', 4);

-- Tebak Angka
INSERT INTO exercise_checklists (exercise_id, description, sort_order) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Angka rahasia dipilih acak 1-100', 1),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Input tebakan menggunakan ask and wait', 2),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Petunjuk "Terlalu besar/kecil" benar', 3),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Game berhenti saat tebakan benar', 4),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Jumlah percobaan ditampilkan', 5);

-- Balap Mobil
INSERT INTO exercise_checklists (exercise_id, description, sort_order) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Mobil bergerak kiri/kanan lancar', 1),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Rintangan spawn otomatis dari atas', 2),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Koin dapat dikumpulkan untuk skor', 3),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Tabrakan mengurangi nyawa', 4),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Game Over saat nyawa habis', 5),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Level naik setiap 100 skor', 6);

-- Space Shooter
INSERT INTO exercise_checklists (exercise_id, description, sort_order) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Pesawat player bergerak dan menembak', 1),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Musuh spawn dan bergerak ke bawah', 2),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Peluru player hancurkan musuh + skor', 3),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Peluru musuh mengurangi nyawa player', 4),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Power-up drop dan berfungsi', 5),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Boss battle muncul dan dapat dikalahkan', 6),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'High score tersimpan dan ditampilkan', 7);

-- Memory Game
INSERT INTO exercise_checklists (exercise_id, description, sort_order) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', '16 kartu (8 pasang) dibuat dan diacak', 1),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Kartu buka/tutup dengan animasi', 2),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Logika pasangan benar/salah akurat', 3),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Timer mundur 60 detik berjalan', 4),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Win condition: semua pasangan ditemukan', 5),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Skor dan waktu ditampilkan di akhir', 6);