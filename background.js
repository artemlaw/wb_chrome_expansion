const headers = {
  'authority': 'www.wildberries.ru',
  'accept': '*/*',
  'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
  'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
};

// id магазина определяем для подсветки номеклатуры в резульате поиска, например  для https://www.wildberries.ru/seller/1000
const suppliers = {
  1000: '#33c733' 
}; 

let SPP = 26;

(async () => {
  SPP = await get_spp();
  console.log("SPP:", SPP);
})();

(async () => {
  arr_wh = await get_wh();
  console.log("Warehouse:", arr_wh);
})();

function get_supplier_color(supplier_id) {
  if (suppliers[supplier_id]) {
    return suppliers[supplier_id]
  } else {
    return '#cb11ab'
  }  
}

function getNameWHById(wh_id) {     
  for (let i = 0; i < arr_wh.length; i++) {
      if (arr_wh[i].id === wh_id) {
        if (arr_wh[i].name.includes('склад продавца')) {          
          return arr_wh[i].name.replace('склад продавца', 'FBS');
        } else {
          return arr_wh[i].name;
        }
      }
  }
  return 'Склад неопределен'; 
}

async function get_wh() {
  const url = "https://static-basket-01.wb.ru/vol0/data/stores-data.json";  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (response.status === 200) {      
      return await response.json();
    } else {      
      return [];
    }
  } catch (error) {    
    console.error("Произошла ошибка при получении WH:", error);    
    return [];
  }
}

async function get_spp() {
  const url = "https://www.wildberries.ru/webapi/personalinfo";
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.value.personalDiscount;
    } else {
      // Вернуть SPP по умолчанию в случае ошибки
      return 26;
    }
  } catch (error) {
    // Обработка ошибки при запросе
    console.error("Произошла ошибка при получении SPP:", error);
    // Вернуть SPP по умолчанию
    return 26;
  }
}

chrome.webRequest.onCompleted.addListener(
  function(details) {
    
    if (details.method === "GET") {   
      console.log('Request status:', details.statusCode, 'URL:', details.url);
      // console.log("Response details:", details);      

      // Фильтруем данные ответа
      // chrome.webRequest.filterResponseData(details.requestId, function(data) {
      //   // Обработка данных ответа
      //   console.log(data);
      //   // Возвращаем данные обратно в браузер
      //   return {data: data};
      // });
    } 
    
  },
  { urls: ['<all_urls>'] }
);

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "wb-connector") {     
    port.onMessage.addListener(function(url) {   
      fetch(url, {
        method: 'GET',
        headers: headers            
      })							
      .then(response => response.json())
      .then(data => {   
        fetch(`https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&spp=${SPP}&nm=${data.nm_id}`, {
          method: 'GET',
          headers: headers
        })       
        .then(response => response.json())
        .then(e => {   
          if(!e.data.products.length) {
            prod_ = e.data.products.find(i=>i.id === data.nm_id)
          } else{
            prod_ = e.data.products[0]                     
          } 

          supplier_color = get_supplier_color(prod_.supplierId)            
          w = getNameWHById(prod_.wh) 
          time1 = prod_.time1   
          time2 = prod_.time2 

          wh_info = [];
          price_info = [];
          client_sale = [];
          
          prod_.sizes.forEach(function (size) {
            let stockInfo = size.stocks.map(stock => {
              if (size.origName != 0) {
                return `<li>${size.origName} - ${getNameWHById(stock.wh)} - ${stock.qty} шт.</li>`;
              } else {
                return `<li>${getNameWHById(stock.wh)} - ${stock.qty} шт.</li>`;
              }
            });

            if (size.price) {              
              let priceInfo = '';
              price = (size.price.basic || 0) / 100;
              client_price = (size.price.product || 0) / 100;
              sale = 1 - client_price / price;
              sale_end = Math.floor(sale * 100);

              client_sale.push(sale_end)

              if (size.origName != 0) {
                priceInfo = `<li>${size.origName} - Цена до скидки:    ${price} ₽</li>
                        <li>${size.origName} - Скидка:         ~ ${sale_end}%</li>
                        <li>${size.origName} - Итоговая цена:     ${client_price} ₽</li>`;
              } else {
                priceInfo = `<li>Цена до скидки:    ${price} ₽</li>
                            <li>Скидка:         ~ ${sale_end} %</li>
                            <li>Итоговая цена:     ${client_price} ₽</li>`;
              }              
              price_info.push(priceInfo); 
            }                 
            wh_info.push(stockInfo.join(" "));
          });           
          
          port.postMessage({
            subj_root_name: data.subj_root_name, 
            subj_name: data.subj_name, 
            wh: w, 
            time1: time1, 
            time2: time2, 
            client_sale: client_sale,
            wh_info: wh_info,
            price_info: price_info,
            supplier_color: supplier_color
          }) 
        })      
      })
      .catch(error => console.error(error)) 
    })        
  }
});
