bcoin = require('bitcoinjs-lib');
var key = bcoin.ECPair.fromWIF("cNj1xnXoeJf1fSWX6ADt5ZebCpUYitcYiuQ47Pr3ot4piQKaoKqe",bcoin.networks.testnet);
      const txb = new bcoin.TransactionBuilder()
      const data = Buffer.from('bitcoinjs-lib', 'utf8')
	  //var buf = Buffer.from('pepe');
	  //data.concat([buf]);
      const embed = bcoin.payments.embed({ data: [data] })
      txb.addInput("f04d60ceaf2dee50f66fef01ca5d70ddd6ea097318765d1f5f98dd9112acc472", 0)
      txb.addOutput(embed.output, 1000)
      txb.addOutput("mtny1bdRuEzR86ctapB5oWgNcje6cnZFs6", 1e5)
      txb.sign(0, key)
console.log(txb.build().toHex());
