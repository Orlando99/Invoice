$('#user-actions').click(function() {
  $(this).next().show();
  $(this).next().next().show();
});

$('.window-shadow').click(function() {
  $(this).hide();
  $(this).next().hide();
});

$('.add-button').click(function() {
  $('#add-basic-info .window-shadow').show();
  $('#add-basic-info .popup').show();
});

$('#add-basic-info .button-cancel').click(function() {
  $('#add-basic-info').find('.window-shadow').hide();
  $('#add-basic-info').find('.popup').hide();
});
