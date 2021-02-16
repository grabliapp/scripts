var formDescription = [
    {"type": "input", "label": "Запрос","name": "query"},
    {"type": "select", "label": "Тип группы", "name": "type",
      "options": [{"name":"Все", "value": "all"}, {"name":"Группа", "value": "group"}, {"name":"Страница", "value": "page"}, {"name":"Событие", "value": "event"}]
    },
    {"type": "select", "label": "Сортировка", "name": "sort",
      "options": [
        {"name":"сортировать по умолчанию (аналогично результатам поиска в полной версии сайта)", "value": "0"},
        {"name":"сортировать по отношению дневной посещаемости к количеству пользователей", "value": "2"},
        {"name":"сортировать по отношению количества лайков к количеству пользователей", "value": "3"},
        {"name":"сортировать по отношению количества комментариев к количеству пользователей", "value": "4"},
        {"name":"сортировать по отношению количества записей в обсуждениях к количеству пользователе", "value": "5"}
      ]
    },
    {"type": "input", "label": "Id страны","name": "country_id"},
    {"type": "input", "label": "Id города","name": "city_id"},
    {"type": "checkbox", "label": "Товары","name": "market"},
    {"type": "checkbox", "label": "Будущие события","name": "future"},
    {"type": "input", "label": "Кол-во (не более 1000)","name": "count"}
   ];
var resultFields = ["id",
                    "members_count",
                    "type",
                    "name",
                    "screen_name",
                    "description",
                    "photo_200",
                    "activity",
                    "status",
                    "age_limits",
                    "city",
                    "contacts",
                    "country",
                    "site"];
if (location.toString().indexOf("/dev/execute") !== -1) {
  var hash = _jQuery('#dev_req_run_btn').attr('data-hash');
  var reader = new FileReader();
  MC.helpers.generateForm(formDescription, "Отправить", function (values) {
      var code = 'return API.groups.getById({"group_ids": API.groups.search({' +
          '"q":"' + values.query + '"' +
          (values.type != "all" ? ', "type": "' + values.type  + '"': '' ) +
      	  (values.country_id != "" ? ', "country_id": "' + values.country_id  + '"': '' ) +
			  	(values.city_id != "" ? ', "city_id": "' + values.city_id  + '"': '' ) +
    			', "market": "' + (values.market ? 1: 0) + '"' +
    			', "future": "' + (values.future ? 1: 0) + '"' +
          ', "sort": "' + values.sort + '"' +
          ', "count": "' + (values.count == "" ? 1000 : values.count) +
          '"}).items@.id, "fields": "description,activity,age_limits,city,contacts,counters,country,links,members_count,site,start_date,finish_date,status"});';
      var handler = function() {
          //prevent duplication for the next run
          reader.removeEventListener("loadend", handler, false);
            var json = JSON.parse(reader.result);
            if (JSON.parse(json.payload[1][0]).error) {
              MC.console(JSON.parse(json.payload[1][0]).error.error_msg + " Code: " + code);
              return;
            }
            var response = JSON.parse(json.payload[1][0]).response;
            var arrayValues = response;
            if (arrayValues.length == 0) {
              MC.console("Ничего не найдено.");
              return;
            }
            MC.saveRow("GroupsByQuery"+ values.query,"clean", 1, async function () {
              // Write headers
              await MC.saveRow("GroupsByQuery"+ values.query, MC.helpers.packCSV(MC.helpers.getHeaderCSV(MC.helpers.filterObject(arrayValues[0], resultFields))));
              // Write data
              var counter = 0;
              for (var i in arrayValues) {
                arrayValues[i] = MC.helpers.filterObject(arrayValues[i], resultFields);
                arrayValues[i] = MC.helpers.packCSV(MC.helpers.flatten(arrayValues[i]));
                await MC.saveRow("GroupsByQuery"+ values.query, arrayValues[i]);
                counter++;
                MC.clearConsole();
                MC.console("Counter: " + counter);
              }

              MC.console("Готово. Всего добавлено " + arrayValues.length);
            });
          };
      reader.addEventListener("loadend", handler);
      fetch("https://vk.com/dev", {
        "headers": {
          "accept": "*/*",
          "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          "content-type": "application/x-www-form-urlencoded",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest"
        },
        "referrer": "https://vk.com/dev/execute?params[code]=" + code + "&params[v]=5.126",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "act=a_run_method&al=1&hash=" + hash + "&method=execute&param_code=" + code + "&param_v=5.126",
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      })
      .then(function(response) {
        return response.blob();
      })
      .then(function(blob) {
        return reader.readAsText(blob, "windows-1251");
      });
  });
} else {
  MC.console('Пожалуйста, откройте <a href="https://vk.com/dev/execute">dev execute</a> и перезапустите скрипт.');
}
