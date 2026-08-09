const { initDatabase, run, query } = require('./database/db');

async function main() {
  await initDatabase();

  // Reset status of existing vehicles to available
  run("UPDATE vehicles SET status = 'available'");

  const vehicles = [
    ['BMW M8 Competition Coupé','BMW','M8 Competition',2024,2450000,2100,'Petrol','625 hp','4.4L V8 Twin-Turbo','Automatic','Coupé','Obsidian Black','Freetown','new','available',1,'Twin-turbocharged V8 powerhouse. Certified factory Onyx Black with full carbon trim package. Sport exhaust, M Driver\'s package.',JSON.stringify(['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&q=85'])],
    ['Mercedes-AMG GT 63 S','Mercedes-Benz','AMG GT 63 S',2024,3200000,480,'Petrol','639 hp','4.0L V8 Biturbo','Automatic','Sedan','Polar White','Freetown','new','available',1,'AMG\'s apex four-door grand tourer. Performance package, Night package, carbon ceramic brakes. Factory warranty valid.',JSON.stringify(['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=900&q=85'])],
    ['Porsche 911 Turbo S','Porsche','911 Turbo S',2024,4100000,480,'Petrol','650 hp','3.8L Flat-6 Twin-Turbo','PDK 8-spd','Coupé','Midnight Blue','Freetown','new','available',1,'The pinnacle of rear-engined sports car engineering. Sport Chrono package, Bose surround sound, heated/ventilated seats.',JSON.stringify(['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=85'])],
    ['Ferrari 296 GTB','Ferrari','296 GTB',2023,6800000,1200,'Hybrid','830 hp','3.0L V6 + Electric Motor','DCT 8-spd','Coupé','Rosso Corsa','Freetown','used','available',0,'Ferrari\'s most advanced V6 hybrid. Assetto Fiorano package, Alcantara interior, forged carbon wheels.',JSON.stringify(['https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=900&q=85'])],
    ['Lamborghini Huracán Tecnica','Lamborghini','Huracán Tecnica',2024,7900000,0,'Petrol','640 hp','5.2L V10 NA','DCT 7-spd','Coupé','Racing Yellow','Freetown','new','available',0,'Factory fresh, 0 km delivery. Giallo Inti pearl yellow. Forged composite wheels, ANIMA driving dynamics selector.',JSON.stringify(['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=85'])],
    ['Audi R8 V10 Performance','Audi','R8 V10',2024,3600000,3800,'Petrol','620 hp','5.2L V10 NA','DCT 7-spd','Coupé','Nardo Grey','Bo','used','available',0,'One of the final naturally aspirated V10 supercars. Laser headlights, Bang & Olufsen audio.',JSON.stringify(['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&q=85'])],
    ['Tesla Model S Plaid','Tesla','Model S Plaid',2024,1950000,0,'Electric','1,020 hp','Tri-Motor Electric','Electric','Sedan','Midnight Silver','Freetown','new','available',0,'World\'s fastest production electric sedan. 0-100 km/h in 2.1s. 17-inch cinematic touchscreen.',JSON.stringify(['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900&q=85'])],
    ['Bentley Continental GT','Bentley','Continental GT',2023,9200000,5400,'Petrol','542 hp','4.0L V8 Twin-Turbo','Automatic 8-spd','Coupé','Tungsten','Freetown','used','available',0,'Grand tourer supreme. Hand-stitched Mulliner interior, panoramic glass roof, rotating display.',JSON.stringify(['https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=900&q=85'])],
    ['Rolls-Royce Ghost II','Rolls-Royce','Ghost',2024,14500000,1050,'Petrol','563 hp','6.75L V12 Twin-Turbo','Automatic 8-spd','Sedan','Arctic White','Freetown','new','available',1,'Post-Opulence Rolls-Royce. Starlight headliner, lambswool floor mats, bespoke audio, illuminated fascia.',JSON.stringify(['https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=900&q=85'])],
    ['McLaren 720S Spider','McLaren','720S Spider',2023,8600000,2300,'Petrol','720 hp','4.0L V8 M840T','DCT 7-spd','Convertible','Papaya Spark','Freetown','used','available',0,'Track-focused convertible supercar. Electrochromatic glass roof, carbon fibre chassis.',JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85'])]
  ];

  for (const v of vehicles) {
    run(`
      INSERT INTO vehicles
        (title,brand,model,year,price,mileage,fuel,hp,engine,transmission,body,colour,location,condition_type,status,featured,description,images)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, v);
  }

  console.log('✅  Updated existing and seeded 10 luxury vehicles into SQLite database!');
}

main().catch(console.error);
