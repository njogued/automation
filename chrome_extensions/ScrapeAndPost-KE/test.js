const textContent = `
'<option data-country="1" value="15" style="display: block;">Athi River, Kenya</option>',
  '<option data-country="1" value="363" style="display: block;">Baringo, Kenya</option>',
  '<option data-country="1" value="359" style="display: block;">Bomet, Kenya</option>',
  '<option data-country="1" value="276" style="display: block;">Bungoma, Kenya</option>',
  '<option data-country="1" value="375" style="display: block;">Busia, Kenya</option>',
  '<option data-country="1" value="391" style="display: block;">Chogoria, Kenya</option>',
  '<option data-country="1" value="367" style="display: block;">Daadab, Kenya</option>',
  '<option data-country="1" value="349" style="display: block;">Dar es Salaam, Kenya</option>',
  '<option data-country="1" value="5" style="display: block;">Eldoret, Kenya</option>',
  '<option data-country="1" value="274" style="display: block;">Embu, Kenya</option>',
  '<option data-country="1" value="19" style="display: block;">Garissa, Kenya</option>',
  '<option data-country="1" value="379" style="display: block;">Homa Bay, Kenya</option>',
  '<option data-country="1" value="380" style="display: block;">Homa Bay, Kenya</option>',
  '<option data-country="1" value="393" style="display: block;">Isiolo, Kenya</option>',
  '<option data-country="1" value="360" style="display: block;">Kajiado, Kenya</option>',
  '<option data-country="1" value="370" style="display: block;">Kakamega, Kenya</option>',
  '<option data-country="1" value="366" style="display: block;">Kakuma, Kenya</option>',
  '<option data-country="1" value="9" style="display: block;">Kangundo, Kenya</option>',
  '<option data-country="1" value="390" style="display: block;">Kapenguria, Kenya</option>',
  '<option data-country="1" value="16" style="display: block;">Karuri, Kenya</option>',
  '<option data-country="1" value="138" style="display: block;">Kenya</option>',
  '<option data-country="1" value="6" style="display: block;">Kehancha, Kenya</option>',
  '<option data-country="1" value="358" style="display: block;">Kericho, Kenya</option>',
  '<option data-country="1" value="364" style="display: block;">Kiambu, Kenya</option>',
  '<option data-country="1" value="397" style="display: block;">Kibwezi, Kenya</option>',
  '<option data-country="1" value="350" style="display: block;">Kigali, Kenya</option>',
  '<option data-country="1" value="8" style="display: block;">Kikuyu, Kenya</option>',
  '<option data-country="1" value="18" style="display: block;">Kilifi, Kenya</option>',
  '<option data-country="1" value="373" style="display: block;">Kirinyaga, Kenya</option>',
  '<option data-country="1" value="275" style="display: block;">Kisii, Kenya</option>',
  '<option data-country="1" value="3" style="display: block;">Kisumu, Kenya</option>',
  '<option data-country="1" value="361" style="display: block;">Kitale, Kenya</option>',
  '<option data-country="1" value="12" style="display: block;">Kitui, Kenya</option>',
  '<option data-country="1" value="383" style="display: block;">Kwale, Kenya</option>',
  '<option data-country="1" value="392" style="display: block;">Laikipia, Kenya</option>',
  '<option data-country="1" value="388" style="display: block;">Lamu, Kenya</option>',
  '<option data-country="1" value="346" style="display: block;">Limuru, Kenya</option>',
  '<option data-country="1" value="384" style="display: block;">Lodwar, Kenya</option>',
  '<option data-country="1" value="347" style="display: block;">Maasai Mara, Kenya</option>',
  '<option data-country="1" value="13" style="display: block;">Machakos, Kenya</option>',
  '<option data-country="1" value="385" style="display: block;">Magadi, Kenya</option>',
  '<option data-country="1" value="396" style="display: block;">Makueni, Kenya</option>',
  '<option data-country="1" value="10" style="display: block;">Malindi, Kenya</option>',
  '<option data-country="1" value="382" style="display: block;">Mandera, Kenya</option>',
  '<option data-country="1" value="389" style="display: block;">Marsabit, Kenya</option>',
  '<option data-country="1" value="368" style="display: block;">Meru, Kenya</option>',
  '<option data-country="1" value="378" style="display: block;">Migori, Kenya</option>',
  '<option data-country="1" value="2" style="display: block;">Mombasa, Kenya</option>',
  '<option data-country="1" value="371" style="display: block;">Muranga, Kenya</option>',
  '<option data-country="1" value="1" style="display: block;">Nairobi, Kenya</option>',
  '<option data-country="1" value="11" style="display: block;">Naivasha, Kenya</option>',
  '<option data-country="1" value="4" style="display: block;">Nakuru, Kenya</option>',
  '<option data-country="1" value="356" style="display: block;">Nandi, Kenya</option>',
  '<option data-country="1" value="362" style="display: block;">Nandi, Kenya</option>',
  '<option data-country="1" value="277" style="display: block;">Nanyuki, Kenya</option>',
  '<option data-country="1" value="357" style="display: block;">Narok, Kenya</option>',
  '<option data-country="1" value="395" style="display: block;">Nyandarua, Kenya</option>',
  '<option data-country="1" value="17" style="display: block;">Nyeri, Kenya</option>',
  '<option data-country="1" value="369" style="display: block;">Oyugis, Kenya</option>',
  '<option data-country="1" value="7" style="display: block;">Ruiru, Kenya</option>',
  '<option data-country="1" value="353" style="display: block;">Rumuruti, Kenya</option>',
  '<option data-country="1" value="352" style="display: block;">Samburu, Kenya</option>',
  '<option data-country="1" value="381" style="display: block;">Siaya, Kenya</option>',
  '<option data-country="1" value="386" style="display: block;">Taveta, Kenya</option>',
  '<option data-country="1" value="394" style="display: block;">Tana River, Kenya</option>',
  '<option data-country="1" value="377" style="display: block;">Tharaka Nithi, Kenya</option>',
  '<option data-country="1" value="14" style="display: block;">Thika, Kenya</option>',
  '<option data-country="1" value="372" style="display: block;">Trans Nzoia, Kenya</option>',
  '<option data-country="1" value="354" style="display: block;">Turkana, Kenya</option>',
  '<option data-country="1" value="374" style="display: block;">Uasin Gishu, Kenya</option>',
  '<option data-country="1" value="20" style="display: block;">Vihiga, Kenya</option>',
  '<option data-country="1" value="387" style="display: block;">Wajir, Kenya</option>',
  '<option data-country="1" value="365" style="display: block;">Zanzibar, Kenya</option>'
`;

// Split the text content by lines

const lines = textContent.split('\n');

let locations = {}

const filterLocations = lines.forEach(line => {
    const cleanedLine = line.replace(/'<option data-country="1" value="/, '').replace(/" style="display: block;">/, ' <').replace("</option>',", "").replace("</option>'", "").trim().split(" <");
    if (cleanedLine.length < 2) {
        return;
    }
    const key = cleanedLine[1];
    const value = cleanedLine[0];
    if (key.includes("undefined")) {
        return
    }
    locations[key] = value;
    return;
  });

console.log(locations);