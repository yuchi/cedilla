cedilla.simplifyAccess();

var en = new cedilla.Language('en','English');

cedilla.currentLanguage = en;

en.addAll({
	'you-have-x-unread-messages' : {
		'{count}'  : {
			'0'    : 'Oh noes! no messages',
			'1'    : 'You have {count} unread message',
			':else': 'You have {count} new messages'
			//'>5': 'You have a lot of new messages!',
			//'>1': 'You have {count} unread messages',
		},
		'{!count}' : 'Error'
	},
	'test' : 'dalla traducciòn {part}'
});
