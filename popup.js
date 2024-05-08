const articleH5 = document.getElementById('article'),
      articleINPUT = document.getElementById('article_inp'),
      articleBTN = document.getElementById('article_save_btn')

articleBTN.addEventListener("click", (e) =>{   
  articleH5.innerHTML = `Ищу: ${articleINPUT.value}`
  chrome.storage.sync.set({'article': articleINPUT.value}, function() {
    console.log('article сохранен в хранилище', articleINPUT.value) 
  })  
})

chrome.storage.sync.get(['article'], function (value) {  
  if(value.article) { 
    articleH5.innerHTML = `Ищу: ${value.article}`
  } else { 
    articleH5.innerHTML = 'Поиск товара по артикулу'     
  }
})

chrome.storage.onChanged.addListener(
	(changes, areaName) => {
	  console.log('Изменение', changes.article)	  
	}
)
