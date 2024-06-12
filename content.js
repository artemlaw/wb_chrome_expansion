let article = "",
 	doc_irl = document.URL,
	arr_nm_id = [],
  regex = /wildberries\.ru\/catalog\/[^\/]+\//,	
  regex_detal = /wildberries\.ru\/catalog\/[^\/]+\/detail/ ;

function a() {
	chrome.storage.sync.get(['article'], function (value) { 
		if(value.article) {  
			article = value.article 
			if(document.querySelector('#c' + article )) {
				let card = document.querySelector('#c' + article )
				console.log('Найден', card)	
				card.style.cssText=`color: black; background-color: black; border: 2rem solid;`;
			}
		}
	})
}

function s() {
	document.querySelectorAll('[data-nm-id]').forEach((elem, index)=>{
		
		elem.addEventListener("mouseenter", (event) => {
				
			const mousElement = event.target,			
				    nmid = mousElement.getAttribute('data-nm-id')

			if(doc_irl != document.URL) {
				arr_nm_id = []
				doc_irl = document.URL
			}

			if (arr_nm_id.includes(nmid)) {
				console.log(`Карточка ${nmid} обработана`)
			} else {
				console.log(`Карточка ${nmid} не обработана`)
				const srcValue = mousElement.querySelector('.j-thumbnail').src,
				 	  url = srcValue.substring(0, srcValue.indexOf('images')) + 'info/ru/card.json'

				arr_nm_id.push(elem.getAttribute('data-nm-id'))
				if(arr_nm_id.length > 1) {
					arr_nm_id = [...new Set(arr_nm_id)]	
				}

				const port = chrome.runtime.connect({name: "wb-connector"})
				
				port.postMessage(url)
				port.onMessage.addListener(function(message) {

					if (message.supplier_color) {
						bg_color = message.supplier_color
					} else {
						bg_color = '#cb11ab'
					}
					
					const newElement = document.createElement('div')					
					newElement.className = 'wg_push'					
					newElement.innerHTML = `<span>№${index + 1}</span><span>${message.wh} <br>${message.client_sale}%</span><span>${message.subj_name}</span>`					
					newElement.style.backgroundColor = bg_color
					newElement.style.border = `2px solid ${bg_color}`
					newElement.style.padding = '10px'
					newElement.style.display = 'flex'
					newElement.style.justifyContent = 'space-between'
					newElement.style.fontSize = '14px'
					newElement.style.alignItems = 'center'
					newElement.style.color = '#fff'
					newElement.style.textAlign = 'center'

					const firstSpan = newElement.querySelector('span:first-child')
					firstSpan.style.fontWeight = 'bold'
					firstSpan.style.fontSize = '1.2em'

					const otherSpans = newElement.querySelectorAll('span:not(:first-child)')
					otherSpans.forEach(span => {
					span.style.marginLeft = '10px'
					span.style.color = '#333333'
					span.style.fontSize = '0.9em'
					})

					const lastSpan = newElement.querySelector('span:last-child')					
					lastSpan.style.marginLeft = '10px'				
					lastSpan.style.fontSize = '0.9em'
					lastSpan.style.color = '#fff'

					// mousElement.appendChild(newElement)	
					const firstEl = mousElement.firstElementChild	
					firstEl.appendChild(newElement)				
					// mousElement.insertBefore(newElement, mousElement.firstElementChild)			
				})	
			}			
		})	
	})	
}

function st(observer){ 
    
  const d = document.querySelector('.product-page__aside-sticky'),  
    newEl = document.querySelector('.wg_push'),
    port_st = chrome.runtime.connect({name: "wb-connector"})

  if(d && !newEl && !d.hasAttribute('data-added')) {

    const srcValue = document.querySelector('.photo-zoom__preview').src,
    url = srcValue.substring(0, srcValue.indexOf('images')) + 'info/ru/card.json'    
        
    port_st.postMessage(url)
    observer.disconnect()

    port_st.onMessage.addListener(function(message) {
      if(!newEl){      
        const newD = document.createElement('ul')
        newD.className = 'wg_push'      
        newD.innerHTML = `<li>Категория: ${message.subj_name}</li>        
                          <li>---------------------------------------------</li>
                          <li>Цены:</li> 
						  ${message.price_info}  
                          <li>---------------------------------------------</li> 
                          <li>Остатки на складах:</li>   
                          ${message.wh_info}                      
                          `
        newD.style.backgroundColor = '#cb11ab'
        newD.style.border = '2px solid #cb11ab'
        newD.style.padding = '10px'
        newD.style.display = 'flex'
        newD.style.justifyContent = 'space-between'
        newD.style.fontSize = '14px'
        newD.style.flexDirection = 'column'        
        newD.style.alignItems = 'flex-start'
        newD.style.color = '#fff'
        newD.style.textAlign = 'center'
      
        d.appendChild(newD)	        
        d.setAttribute('data-added', 'true')
      }      
    })
  }  
}

const observer = new MutationObserver(function (mutations, observer) {
	
	let url = document.URL

	if (regex.test(url) == 1 && regex_detal.test(url) != 1) {		
		s()				
		chrome.storage.sync.get(['article'], function (value) { 
			if(value.article) {  
				article = value.article 
				if(document.querySelector('#c' + article )) {
					let card = document.querySelector('#c' + article )
					console.log('Найден', card.getAttribute('data-nm-id'))	
					card.style.cssText=`color: black; background-color: black; border: 0.5rem solid; border-radius: 8px;`;
				}
			}	
		})
		
	} else if (regex.test(url) == 1 && regex_detal.test(url) == 1) {		
    st(observer) 
	}		
})

observer.observe(document.body, { childList: true, subtree: true })
