(function() {
    dala.require('templateManager').registerTemplate('simple_ellipse', {
        description : "Simple ellipse with text",
        dockingType : "ELLIPSE",
        color_main : "#FFFFFF",
        title : "ellipse",
        resize : [
            {bind:"#body_back", value:"default", min:"parent"},
            {bind:"#title_t", position: "center"}
        ],
        edit: {
            title : {
                type : "text",
                label : "Text",
                bind : "#title_span",
                trigger : "#title_t"
            },
            mainColor : {
                type : "color",
                label : "Main Color",
                bind : "#body_back"
            }
        }
    });
})();