var globe = {
    years: [],
    globe_width:0,
    globe_responsiveness: "big",
    card_position: 0,
    card_types:["top_left","bottom_right","top_right","bottom_left"],
    all_data: [],
    ydi_data: [],
    region_data: [],
    card_fills:{"0":"#247436","1":"#f55b2d","2":"#37377d"},
    colours: ["#5FB95F","#37377D","#0069B4","#FA914B",'#E6eB41',"#C83C87","#009B9B","#F04141"],
    range_colours:{"green":["#DFF1DF","#247436"],"orange":["#FEE9DB","#f55b2d"],"purple":["#EBEBF2","#37377d"]},
    colour_to_font:{"#5FB95F":"#333333","#37377D":"white","#0069B4":"white","#FA914B":"#333333",'#E6eB41':"#333333",
        "#C83C87":"#333333","#009B9B":"#333333","#F04141":"#333333"},
    stored_regions:{},
    rotationOn: true
};
