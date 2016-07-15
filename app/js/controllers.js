angular.module('app.controllers', ['electangular'])

.controller('MainController', ['$scope', '$rootScope', 'electron', '$mdDialog', '$mdToast', '$filter', '$timeout', function($scope, $rootScope, electron, $mdDialog, $mdToast, $filter, $timeout) {

  var db = require('diskdb');
  db = db.connect(electron.app.getPath('userData'), ['notebooks', 'pages']);

  var orderBy = $filter('orderBy');
  var limitTo = $filter('limitTo');
  var timeout = null;

  var options = {
     multi: false,
     upsert: false
  };

  $scope.activeTheme = {
    theme: "Dark",
    editor: "monokai"
  }

  $scope.layout = {
    columns : 3
  };

  $scope.notebookCount = {
    inbox: 0,
    bookmarks: 0,
    recent: 0,
    trash: 0,
    allNotes: 0
  };
  $scope.newNotebook = {};
  $scope.notebooks = [];
  $scope.pages = null;
  $scope.activeNotebook = {};
  $scope.activePage = {};
  $scope.selectNotebook = {
    notebookName: 'Select a Notebook',
    id: 0
  };
  $scope.trashNotebooks = {};
  $scope.pageData = {};
  $scope.editable = {};
  $scope.activeView = 'View';
  $scope.activeLibrary = '';
  $scope.pageSort = 'pageDate';

  $scope.activeLanguage = {
    language : "javascript"
  };

  $scope.languages = [
    {"languageName":"C#","languageSyntax":"csharp","languageExt" : ".cs"},
    {"languageName":"Java","languageSyntax":"java","languageExt" : ".java"},
    {"languageName":"C/C++","languageSyntax":"c_cpp","languageExt" : ".cpp"},
    {"languageName":"PHP","languageSyntax":"php","languageExt" : ".php"},
    {"languageName":"Go","languageSyntax":"go","languageExt" : ".go"},
    {"languageName":"Python","languageSyntax":"python","languageExt" : ".py"},
    {"languageName":"Ruby","languageSyntax":"ruby","languageExt" : ".rb"},
    {"languageName":"Lua","languageSyntax":"lua","languageExt" : ".lua"},
    {"languageName":"Javascript","languageSyntax":"javascript","languageExt" : ".js"},
    {"languageName":"HTML5","languageSyntax":"html","languageExt" : ".html"}
  ];

  $scope.getNotebooks = function() {
    $scope.notebooks = db.notebooks.find({notebookTrash: 0});
  };

  $scope.getPages = function(notebookID) {
    $scope.activeNotebook = notebookID;
    $scope.selectNotebook = db.notebooks.findOne({_id: notebookID});
    $scope.initPages = db.pages.find({pageNotebook : notebookID});
    $scope.pages = [];
    if($scope.selectNotebook.notebookTrash == 0)
    {
      angular.forEach($scope.initPages, function(value, key) {
        if(value.pageTrash != 1)
        {
          $scope.pages.push(value);
        }
      });
    }
    else {
      angular.forEach($scope.initPages, function(value, key) {
        if(value.pageTrash == 1)
        {
          $scope.pages.push(value);
        }
      });
    }
    $scope.pages = orderBy($scope.pages, 'pageDate', true);
  };

  $scope.getCount = function() {
    $scope.notebookCount.recent = db.pages.find({pageTrash: 0});
    $scope.notebookCount.recent = limitTo($scope.notebookCount.recent, 15);
    $scope.notebookCount.recent = $scope.notebookCount.recent.length;
    $scope.notebookCount.trash = db.pages.find({pageTrash: 1}).length + db.notebooks.find({notebookTrash: 1}).length;
    $scope.notebookCount.bookmarks = db.pages.find({pageStarred: 1}).length;
    $scope.notebookCount.allNotes = db.pages.find({pageTrash: 0}).length;
  };

  $scope.selectPage = function(pageID) {
    $scope.activePage = pageID;
    $scope.pageData = db.pages.findOne({_id: pageID});
    $scope.activeLanguage.language = $scope.pageData.pageLanguage;
    $scope.getCount();
  };

  $scope.getView = function(viewOption) {
    $scope.activeView = viewOption;
    if(viewOption == 'Code')
    {
      $scope.loadEditor();
    }
  };

  $scope.getBookmarks = function() {
    $scope.activeNotebook = 'Bookmarks';
    $scope.selectNotebook.notebookName = 'Bookmarks';
    $scope.pages = db.pages.find({pageStarred: 1});
    $scope.pages = orderBy($scope.pages, 'pageDate', true);
  };

  $scope.getRecent = function() {
    $scope.activeNotebook = 'Recent';
    $scope.selectNotebook.notebookName = 'Recent';
    $scope.pages = db.pages.find({pageTrash: 0});
    $scope.notebookArray = db.notebooks.find();
    $scope.pages = limitTo($scope.pages, 5);
    $scope.pages = orderBy($scope.pages, 'pageModified', true);
    angular.forEach($scope.pages, function(value, key) {
      angular.forEach($scope.notebookArray, function(value2, key2) {
        if(value.pageNotebook == value2._id)
        {
          value.pageNotebook = value2.notebookName;
        }
      });
    });
  };

  $scope.setBookmark = function(pageID) {
    var query = { _id: pageID };
    if($scope.pageData.pageStarred == 0)
    {
      var dataToBeUpdate = { pageStarred : 1 };
      db.pages.update(query, dataToBeUpdate, options);
      $scope.notifyToast('Bookmark Saved.');
    }
    else {
      var dataToBeUpdate = { pageStarred : 0 };
      db.pages.update(query, dataToBeUpdate, options);
      $scope.notifyToast('Bookmark Removed.');
    }
    $scope.selectPage(pageID);
    $scope.getCount();
  };

  $scope.getTrash = function() {
    $scope.activeNotebook = 'Trash';
    $scope.selectNotebook.notebookName = 'Trash';
    $scope.trashNotebooks = db.notebooks.find({notebookTrash: 1})
    $scope.pages = db.pages.find({pageTrash: 1});
    $scope.notebookArray = db.notebooks.find();
    angular.forEach($scope.pages, function(value, key) {
      angular.forEach($scope.notebookArray, function(value2, key2) {
        if(value.pageNotebook == value2._id)
        {
          value.pageNotebook = value2.notebookName;
        }
      });
    });
  };

  $scope.getAllNotes = function() {
    $scope.activeNotebook = 'All Notes';
    $scope.selectNotebook.notebookName = 'All Notes';
    $scope.pages = db.pages.find({pageTrash: 0});
    $scope.notebookArray = db.notebooks.find();
    $scope.pages = orderBy($scope.pages, 'pageModified', true);
    angular.forEach($scope.pages, function(value, key) {
      angular.forEach($scope.notebookArray, function(value2, key2) {
        if(value.pageNotebook == value2._id)
        {
          value.pageNotebook = value2.notebookName;
        }
      });
    });
  };

  $scope.sortPages = function(sortType) {
    var inverse = true;
    if(sortType == 'pageTitle' && $scope.pageSort != 'pageTitleInverse')
    {
      var inverse = false;
      $scope.pages = orderBy($scope.pages, sortType, inverse);
      $scope.pageSort = 'pageTitleInverse';
    }
    else if(sortType == 'pageTitle' && $scope.pageSort != 'pageTitle')
    {
      $scope.pages = orderBy($scope.pages, sortType, inverse);
      $scope.pageSort = 'pageTitle';
    }
    else if(sortType == 'pageDate' && $scope.pageSort != 'pageDate')
    {
      $scope.pages = orderBy($scope.pages, sortType, inverse);
      $scope.pageSort = 'pageDate';
    }
    else if(sortType == 'pageDate' && $scope.pageSort != 'pageDateInverse')
    {
      var inverse = false;
      $scope.pages = orderBy($scope.pages, sortType, inverse);
      $scope.pageSort = 'pageDateInverse';
    }
    else if(sortType == 'pageModified' && $scope.pageSort != 'pageModified')
    {
      $scope.pages = orderBy($scope.pages, sortType, inverse);
      $scope.pageSort = 'pageModified';
    }
    else if(sortType == 'pageModified' && $scope.pageSort != 'pageModifiedInverse')
    {
      var inverse = false;
      $scope.pages = orderBy($scope.pages, sortType, inverse);
      $scope.pageSort = 'pageModifiedInverse';
    }
  };

  $scope.newNotebook = function(ev) {
    $mdDialog.show({
      controller: 'MainController',
      templateUrl: 'newNotebook.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true
    }).finally(function() {
      $scope.getNotebooks();
    });
  };

  $scope.closeDialog = function() {
    $mdDialog.cancel();
  };

  $scope.notifyToast = function(message) {
    $mdToast.show(
      $mdToast.simple()
        .textContent(message)
        .position('top right')
        .hideDelay(3000)
    );
  };

  $scope.addNotebook = function()
  {
    if($scope.newNotebook.notebookName == undefined)
    {
      $scope.newNotebook.notebookName = "New Notebook";
    }
    var date = Date.now();
    var notebook = {
      notebookName: $scope.newNotebook.notebookName,
      notebookDesc: '',
      notebookTrash: 0,
      notebookPages: 0,
      notebookStarred: 0,
      notebookDate: date,
      notebookModified: date
    };

    db.notebooks.save(notebook);
    $scope.closeDialog();
    $scope.notifyToast('Notebook Added');
  };

  $scope.addPage = function(notebookID)
  {
    if($scope.selectNotebook.id != 0)
    {
      var notebook = db.notebooks.findOne({_id: notebookID});
      if(notebook.notebookTrash == 0)
      {
        var date = Date.now();

        var page = {
          pageTitle: 'New Page',
          pageBody: '',
          pageCode: '',
          pageLanguage : $scope.activeLanguage.language,
          pageNotebook: notebookID,
          pageTrash: 0,
          pageStarred: 0,
          pageDate: date,
          pageModified: date
        };

        db.pages.save(page);

        var query = { _id: notebookID };
        var pageData = {
          notebookPages : notebook.notebookPages + 1,
          pageModified : date
        };

        db.notebooks.update(query, pageData, options);
        $scope.getPages(notebookID);
        $scope.getNotebooks();
        $scope.getCount();
      }
      else {
        $scope.notifyToast("You cannot add a page here.");
      }
    }
    else {
      $scope.notifyToast("No Notebook Selected");
    }
  };

  $scope.savePageName = function(data, pageID)
  {
    var date = Date.now();
    var query = { _id: pageID };
    var pageData = {
      pageTitle : data,
      pageModified : date
    };

    db.pages.update(query, pageData, options);
    $scope.notifyToast('Page Saved.');
    if($scope.selectNotebook.notebookName == 'Recent')
    {
      $scope.getRecent();
    }
    else if($scope.selectNotebook.notebookName == 'Bookmarks')
    {
      $scope.getBookmarks();
    }
    else {
      $scope.getPages($scope.selectNotebook._id);
    }
    $scope.selectPage(pageID);
  };

  $scope.savePage = function()
  {
    var date = Date.now();
    var query = { _id: $scope.pageData._id };
    var pageData = {
      pageBody : $scope.pageData.pageBody,
      pageCode : $scope.pageData.pageCode,
      pageLanguage : $scope.activeLanguage.language,
      pageModified : date
    };

    db.pages.update(query, pageData, options);
    $scope.notifyToast('Page Saved.');
  };

  var silentSave = function() {
    var date = Date.now();
    var query = { _id: $scope.pageData._id };
    var pageData = {
      pageBody : $scope.pageData.pageBody,
      pageCode : $scope.pageData.pageCode,
      pageLanguage : $scope.activeLanguage.language,
      pageModified : date
    };

    db.pages.update(query, pageData, options);
  };

  var debounceSaveUpdates = function(newVal, oldVal) {
    if (newVal != oldVal) {
      if (timeout) {
        $timeout.cancel(timeout)
      }
      timeout = $timeout(silentSave, 300000);  // 1000 = 1 second
    }
  };

  $scope.saveNotebookName = function(data, notebookID)
  {
    var date = Date.now();
    var query = { _id: notebookID };
    var dataToBeUpdate = {
      notebookName : data,
      pageModified : date
    };

    db.notebooks.update(query, dataToBeUpdate, options);
    $scope.notifyToast('Notebook Saved.');
    $scope.getNotebooks();
  }

  $scope.deleteNotebook = function(notebookID)
  {
    var notebook = db.notebooks.findOne({_id:notebookID});
    if(notebook.notebookTrash == 0)
    {
      var date = Date.now();
      var query = { _id: notebookID };
      var notebookData = {
        notebookTrash : 1,
        notebookModified : date
      };

      db.notebooks.update(query, notebookData, options);

      var query = { pageNotebook: notebookID };
      var pageData = {
        pageTrash : 1,
        pageModified : date
      };
      var deleteOptions = {
         multi: true,
         upsert: false
      };

      db.pages.update(query, pageData, deleteOptions);
      $scope.notifyToast('Notebook Deleted.');
      $scope.getNotebooks();
      $scope.activeNotebook = {};
      $scope.selectNotebook = {
        notebookName: 'Select a Notebook',
        id: 0
      };
    }
    else {
      db.pages.remove({pageNotebook: notebookID});
      db.notebooks.remove({_id : notebookID});
      $scope.getTrash();
    }
    $scope.activePage = {};
    $scope.pages = null;
    $scope.pageData = {};

    $scope.getCount();
  };

  $scope.restoreNotebook = function(notebookID)
  {
    var date = Date.now();
    var query = { _id: notebookID };
    var notebookData = {
      notebookTrash : 0,
      notebookModified : date
    };

    db.notebooks.update(query, notebookData, options);

    var query = { pageNotebook: notebookID };
    var pageData = {
      pageTrash : 0,
      pageModified : date
    };
    var deleteOptions = {
       multi: true,
       upsert: false
    };

    db.pages.update(query, pageData, deleteOptions);
    $scope.notifyToast('Notebook Restored.');
    $scope.getTrash();
    $scope.getNotebooks();
    $scope.getCount();
  };


  $scope.deletePage = function(pageID)
  {
    var page = db.pages.findOne({_id:pageID});
    if(page.pageTrash == 0)
    {
      var date = Date.now();
      var query = { _id: pageID };
      var pageData = {
        pageTrash : 1,
        pageModified : date
      };

      db.pages.update(query, pageData, options);

      var pageCount = db.notebooks.findOne({_id: $scope.activeNotebook});

      var query = { _id: $scope.activeNotebook};
      var notebookData = {
        notebookPages : pageCount.notebookPages - 1,
        pageModified : date
      };

      db.notebooks.update(query, notebookData, options);
      $scope.getNotebooks();
    } else {
      db.pages.remove({_id : pageID});
    }

    angular.forEach($scope.pages, function(value, key) {
      if(value._id == pageID)
      {
        $scope.pages.splice(key, 1);
      }
    });

    $scope.pageData = {};
    $scope.getCount();
    $scope.notifyToast('Page Deleted.');
  };

  $scope.restorePage = function(pageID)
  {
    var page = db.pages.findOne({_id:pageID});
    var notebook = db.notebooks.findOne({_id: page.pageNotebook});
    if(notebook.notebookTrash == 0)
    {
      var date = Date.now();
      var query = { _id: pageID };
      var pageData = {
        pageTrash : 0,
        pageModified : date
      };

      db.pages.update(query, pageData, options);

      var query = { _id: page.pageNotebook};
      var notebookData = {
        notebookPages : notebook.notebookPages + 1,
        pageModified : date
      };

      db.notebooks.update(query, notebookData, options);
      $scope.getNotebooks();

      angular.forEach($scope.pages, function(value, key) {
        if(value._id == pageID)
        {
          $scope.pages.splice(key, 1);
        }
      });

      $scope.getCount();
      $scope.notifyToast('Page Restored.');
    }
    else {
      $scope.notifyToast("You cannot restore this page.");
    }
  };


  $scope.openMenu = function($mdOpenMenu, ev) {
      $mdOpenMenu(ev);
  };

  $scope.nextPage = function() {
    var pageID = $scope.activePage;
    angular.forEach($scope.pages, function(value, key) {
      if(value._id == $scope.activePage)
      {
        if($scope.pages[key + 1] != undefined)
        {
          pageID = $scope.pages[key + 1]._id;
        }
      }
    });
    $scope.selectPage(pageID);
  };

  $scope.previousPage = function() {
    var pageID = $scope.activePage;
    angular.forEach($scope.pages, function(value, key) {
      if(value._id == $scope.activePage)
      {
        if($scope.pages[key - 1] != undefined)
        {
          pageID = $scope.pages[key - 1]._id;
        }
      }
    });
    $scope.selectPage(pageID);
  };

  $scope.switchTheme = function()
  {
    if($scope.activeTheme.theme == "Dark")
    {
      $scope.activeTheme.theme = "Light";
      $scope.activeTheme.editor = "xcode";
    }
    else
    {
      $scope.activeTheme.theme = "Dark";
      $scope.activeTheme.editor = "monokai";
    }
  };

  /*$rootScope.$on('electron-host', function( evt, data ) {
  });*/

  $scope.getCount();
  $scope.getNotebooks();

  $scope.$watch('pageData.pageBody', debounceSaveUpdates);
  $scope.$watch('pageData.pageCode', debounceSaveUpdates);

}]);
