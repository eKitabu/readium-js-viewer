define(['./ModuleConfig',
'StorageManager',
'./EpubLibraryManager',
        'hgn!readium_js_viewer_html_templates/categories-dialog-body.html',
 './ReaderSettingsDialog_Keyboard',
 'i18nStrings',
 './Dialogs',
 'Settings',
 './Keyboard'],
function(moduleConfig,
StorageManager,
LibraryManager,
CategoriesDialogController,
KeyboardSettings,
Strings,
Dialogs,
Settings,
Keyboard){
    
    var initDialog = function(updateCurrentCssFilterString) {
        $(".standardsTable.filterCategoriesTable td").click(function(){
            $(".filterCategoriesTable td").removeClass("selected");
            $(this).addClass("selected");
            $(".subjectsTable.filterCategoriesTable").removeClass("inactive");
        }); 
        $(".subjectsTable.filterCategoriesTable td").click(function(){

            $(".subjectsTable.filterCategoriesTable td").removeClass("selected");
            $(this).addClass("selected");
            //code to close window and filter the library
            var selectedFilters= [];
            $(".filterCategoriesTable td.selected").each(function(){
                selectedFilters.push($(this).text());
            });
            $(".library-item").hide();
            var filterString = "";
            $.each(selectedFilters,function(key,value){
                value = value.replace(/\./g, "");
                filterString += ".category-" + value.replace(/ /g, "_");
            });

            $(filterString).show();
            updateCurrentCssFilterString(filterString);
            $('.filterCategories-dialog').modal('hide');
            

        }); 
    }
    //make these functions available where mustache has included this JS file
    return{
        initDialog : initDialog
    }
});
