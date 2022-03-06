const Modal = {
    //ABRE MODAL PARKED
    openParked(){
        document.querySelector("#modal-overlay-parked").classList.add('active')
    },

    //FECHA MODAL PARKED
    closeParked(){
        document.querySelector('#modal-overlay-parked').classList.remove('active')
    },

    //ABRE MODAL REGISTER
    openRegister(){
        document.querySelector("#modal-overlay-register").classList.add('active')
    },

    //FECHA MODAL REGISTER
    closeRegister(){
        document.querySelector('#modal-overlay-register').classList.remove('active')

    }
}


const Storage = {

    //RETORNA REGISTRO DOS VEICULOS SALVO NO LOCAL STORAGE
    get(){
        return JSON.parse(localStorage.getItem("parked")) || []
    },

    //SALVA REGISTRO DOS VEICULOS NO LOCAL STORAGE
    set(){
        localStorage.setItem("parked", JSON.stringify(Movement.veiculo))
    },

    //SALVA O ULTIMO REGISTRO DE VEICULO ADICIONADO PARA EXIBIR NA TELA
    setDisplayVeiculo(veiculo){
        localStorage.setItem("veiculo", JSON.stringify(veiculo))

    },

    //SALVA O VALOR DA ESTADIA
    setDisplayValor(valor){
        localStorage.setItem("Valor", JSON.stringify(valor))
    },

    //SALVA HORA-DATA DA SÁIDA DO VEÍCULO
    setDayHourSaida(horaData){
        localStorage.setItem("diaHora", (horaData))
    },

    //SALVA VALOR EM CAIXA 
    setValorTotal(valorTotal){
        localStorage.setItem("valorTotal", valorTotal )
    }
    
}


const Register = {
    valorTotal: Number(localStorage.getItem("valorTotal")),
    retiradaValue: document.querySelector('#retirada'),
    depositoValue: document.querySelector('#deposito'),
    msgTransacao: document.querySelector('#transacao'),

    //SALVAR VALOR NA SÁIDA DE CADA VEÍCULO
    amount(valor){
        Register.valorTotal += valor
        Storage.setValorTotal(Register.valorTotal)   
    },

    //FAZ RETIRADA DE VALOR DO CAIXA
    cashWithdrawal(){
        const retirada = (Register.retiradaValue.value)
        if(Register.valorTotal >= retirada && retirada > 0){
            Register.valorTotal = Math.floor((Register.valorTotal -= retirada) *1000) / 1000
            Storage.setValorTotal(Register.valorTotal)
            Register.retiradaValue.value = ""
            Register.msgTransacao.innerHTML = `RETIRADA EFETUADA COM SUCESSO!`
            Register.msgTransacao.classList.add('active')
            Register.removeMsgTransacao()
            App.reload()
        }
        else{
            alert('Saldo insuficiente ou valor inválido')
            Register.depositoValue.value = ""
        }
    },

    //FAZ DEPOSITO DE VALOR NO CAIXA
    cashDeposit(){
        const deposito = Number(Register.depositoValue.value)
        if(deposito > 0){
            Register.valorTotal = Math.floor((Register.valorTotal += deposito) * 1000 ) / 1000
            Storage.setValorTotal(Register.valorTotal)
            Register.depositoValue.value = ""
            Register.msgTransacao.innerHTML = "DEPOSITO EFETUADO COM SUCESSO!"
            Register.msgTransacao.classList.add('active')
            Register.removeMsgTransacao()
            App.reload()
        }
        else{
            alert('Digite um valor válido maior que R$ 0,00')
            Register.depositoValue.value = ""
        }
    },

    //REMOVE MENSAGEM DE CONFIRMAÇÃO DE TRANSAÇÃO DEPOIS DE INTERVALO DE TEMPO
    removeMsgTransacao(){
        setTimeout(()=>{
            Register.msgTransacao.innerHTML = ""
            Register.msgTransacao.classList.remove('active')
        } , 2500)
    }
}


const Movement = {
    veiculo : Storage.get(),

    //ARMAZENA VEÍCULOS NO ARRAY VEICULO
    addMovimento(veiculo){
        Movement.veiculo.push(veiculo)
        Storage.setDisplayValor("entrada")
        Storage.setDisplayVeiculo(veiculo)
        App.reload()
    },

    //REMOVER VEÍCULO 
    remove(veiculoSaida){
        for(let i = 0; i < Movement.veiculo.length; i++){
            if(Movement.veiculo[i].placa.toUpperCase() == veiculoSaida.placa.toUpperCase()){
                Movement.veiculo.splice(i, 1)
                Storage.setDayHourSaida(Movement.getDayHourSaida())  
            } 
        }
        App.reload()
    },

    //RETORNA DATA E HORA DA SAÍDA DO VEÍCULO
    getDayHourSaida(){
        const dayHour = []
        dayHour.push(Form.FormatHour())
        dayHour.push(Form.formatDate())
        return dayHour
    },

    //PEGAR O TOTAL DE HORAS ESTADIA
    getStayedTime(placaSaida,horaSaida){
        let horaEntrada, cat, veiculoSaida
        Movement.veiculo.forEach(veiculo =>{
            if(placaSaida.toUpperCase() == veiculo.placa.toUpperCase()){
                horaEntrada = veiculo.miliSeconds
                cat = veiculo.categoria
                veiculoSaida = veiculo
            }
        })

        if(veiculoSaida == undefined){
            FormSaida.clearInputFields()
            throw new Error('Essa placa nao existe nos registros de entrada')
        }

       let valor = Movement.calcStayedTime(cat,horaSaida,horaEntrada)
       Register.amount(valor)
       valor = Formatar.formatCurency(valor)
       Storage.setDisplayValor(valor)
       Storage.setDisplayVeiculo(veiculoSaida)
       Movement.remove(veiculoSaida)
    },

    //RETORNA VALOR DA HORA E DIARIA DA CATEGORIA SELECIONADA NA ENTRADA
    getDiariaHora(veiculoCat){
        //carro R$ 6,00 hora - R$24,00 diaria   
        //moto R$ 3,50 hora - R$14,00 diaria
        //pickup R$ 8,00 hora - R$ 32 diaria
        //van R$ 12,00 hora - R$ 48 diaria
        //caminhao R$ 15,00 hora - R$ 60 diaria
        let valorHora, diaria

        if(veiculoCat == "CARRO"){
            valorHora = 6
            diaria = 24
        }else if(veiculoCat == "MOTOCICLETA"){
            valorHora = 3.50
            diaria = 14
        }else if(veiculoCat == "PICKUP"){
            valorHora = 8
            diaria = 32
        }else if(veiculoCat == "VAN"){
            valorHora = 12
            diaria = 48
        }else{
            valorHora = 15
            diaria = 60
        }

        return{
            valorHora,
            diaria
        }
    },

    //CALCULA TOTAL DO TEMPO DE PERMANÊNCIA E RETORNA VALOR A PAGAR
    calcStayedTime(veiculoCat,horaSaida,horaEntrada){
        const daysInSeconds = 24 * 60 * 60
        const hourInSeconds = 60 * 60
        const minutesInseconds = 60
        const stayedTimeInSeconds = (horaSaida - horaEntrada) / 1000
        const days = Math.floor(stayedTimeInSeconds / daysInSeconds)
        const hours = Math.floor(stayedTimeInSeconds / hourInSeconds) % 24
        const minutes = Math.floor(stayedTimeInSeconds / minutesInseconds) % 60
    
        //desistência 5 min 
        //tolerância prox período 15min
        //hora > 4 valor da diaria
        const desistencia = 5
        const tolerancia = 15
        let{valorHora, diaria} = Movement.getDiariaHora(veiculoCat)
        let valorTotal

        if(days == 0 && hours < 1 && minutes > desistencia){
            valorTotal = valorHora
        }
        else if(days == 0 && hours == 1 && minutes <= tolerancia){
            valorTotal = valorHora           
        }
        else if(days == 0 && hours >= 1 && hours < 4 && minutes > tolerancia){
            valorTotal = (hours * valorHora) + valorHora
        }

        else if(days == 0 && hours > 1 && hours < 4 && minutes <= tolerancia){
            valorTotal = hours * valorHora
        }
        
        else if(days >= 0 && hours >= 4){
            valorTotal = (days * diaria) + diaria
        }
       
        else if(days > 0 && hours < 1 && minutes <= tolerancia ){
            valorTotal = days * diaria
        }
        
        else if(days > 0 && hours < 1 && minutes > 15 ){
            valorTotal = (days * diaria) + valorHora
        }

        else if(days >= 0 && hours > 0 && hours < 4 && minutes > 15){
            valorTotal = (days * diaria) + (hours * valorHora) + valorHora
        }

        else if(days >= 0 && hours > 0 && hours < 4 && minutes <= 15){
            valorTotal = (days * diaria) + (hours * valorHora)
        }

        else{
            valorTotal = 0
        }

        return valorTotal    
    }
}


const Dom = {
    tablePatio : document.querySelector('#table tbody'),
    total:  document.querySelector('#total'),
    tds : document.getElementsByTagName('td'),
    infoDisplay : document.querySelector('#info'),
    
    //INSERÇÃO DE HTML DINAMICAMENTE A TABELA
    addMovimentacao(veiculo){
        let tr = document.createElement('tr')
        tr.innerHTML = Dom.innerHtmlMovimento(veiculo)
        Dom.tablePatio.appendChild(tr)
    },

    //INSERÇÃO DE HTML DINAMICAMENTE AO INFODISPLAY NA SAÍDA DO VEÍCULO
    addMovimentacaoFinal(veiculo,valor,hora,data){
        Dom.infoDisplay.innerHTML = ""
        let div  = document.createElement('div')
        div.innerHTML = Dom.InnerHtmlDisplaySaida(veiculo,valor,hora,data)
        Dom.infoDisplay.appendChild(div)
    },

    //INSERÇÃO DE HTML DINAMICAMENTE AO INFODISPLAY NA ENTRADA DO VEÍCULO
    addDisplay(veiculo){
        let div  = document.createElement('div')
        div.innerHTML = Dom.InnerHtmlDisplay(veiculo)
        Dom.infoDisplay.appendChild(div)
    },

    //RETORNA HTML COM LINHA DA TABELA PARA CADA VEÍCULO REGISTRADO
    innerHtmlMovimento(veiculo){
        let html = `
            <td>${Formatar.placaFormatada(veiculo.placa)}</td>
            <td>${veiculo.date}</td>
            <td>${veiculo.hour}</td>
            <td>${veiculo.categoria}</td>
            <td>${veiculo.marca}</td>
            <td>${veiculo.modelo}</td>
        `
        return html
    },

    //MOSTRA NA TELA TOTAL DE VEÍCULOS NO PATIO
    ShowTotal(){
        Dom.total.innerHTML = `TOTAL: ${Movement.veiculo.length} VEÍCULOS`
    },

    //RETORNA HTML QUE SERÁ MOSTRADO AO DAR ENTRADA NO VEÍCULO
    InnerHtmlDisplay(veiculo){
        let html = `
        <h4 style="color:#e92929;">ENTRADA DO VEÍCULO REALIZADA COM SUCESSO! </H4>
        <p><b>PLACA:</b> <i>${Formatar.placaFormatada(veiculo.placa)}</i></p>
        <p><b>ENTRADA:</b> <i>HORA: ${veiculo.hour} - DATA: ${veiculo.date}</i></p>
        <p><b>CATEGORIA:</b> <i>${veiculo.categoria}</i></p>
        <p><b>MARCA:</b> <i>${veiculo.marca}</i></p>
        <p><b>MODELO:</b> <i>${veiculo.modelo}</i></p>
        `
        return html
    },

    //RETORNA HTML QUE SERÁ MOSTRADO AO DAR SAÍDA NO VEÍCULO
    InnerHtmlDisplaySaida(veiculo,valor,data,hora){
        valor = valor.replace(/"/g, "")
        let html = `
        <h4 style="color:#e92929;">SAÍDA DO VEÍCULO REALIZADA COM SUCESSO!</H4>
        <p><b>PLACA:</b> <i>${Formatar.placaFormatada(veiculo.placa)}</i></p>
        <p><b>ENTRADA:</b> <i>HORA: ${veiculo.hour} - DATA: ${veiculo.date}</i></p>
        <p><b>CATEGORIA:</b> <i>${veiculo.categoria}</i></p>
        <p><b>MARCA:</b> <i>${veiculo.marca}</i> - <b>MODELO:</b> <i>${veiculo.modelo}</i></p>
        <p><b>SAÍDA:</b> <i>HORA: ${hora} - DATA: ${data}</i></p>
        <p><b>VALOR:</b> <i>${valor}</i></p>
        `
        return html
    },

    //MOSTRA VALOR TOTAL EM CAIXA NA TELA 
    innerHtmlValorTotal(valorTotal){
        let valor = Number(valorTotal != null ? valorTotal : 0)
        document.querySelector('#valor').innerHTML = `VALOR EM CAIXA: ${Formatar.formatCurency(valor)}`
    },


    clearTransactions(){
        Dom.tablePatio.innerHTML = ""
        Dom.infoDisplay.innerHTML = ""
    }
}


const Form = {
    placa: document.querySelector('#placa'),
    categoria: document.querySelector('input[name="categoria"]'),
    marca: document.querySelector('#marca'),
    modelo: document.querySelector('#modelo'),

    //MÉTODO PARA PEGAR A CATEGORIA SELECIONADA NOS INPUTS TIPO RADIO
    getInputRadio(){
        let categoriaSelected
        document.getElementsByName('categoria')
            .forEach( categoria => {
                if(categoria.checked){
                categoriaSelected = categoria.value
                }
            })
        return categoriaSelected
    },

    //MÉTODO PARA PEGAR TODOS OS VALORES DIGITADOS NOS INPUTS
    getValues(){
        return{
            placa: Formatar.removeCharacter(Form.placa.value),
            categoria: Form.getInputRadio(),
            marca: Form.marca.value,
            modelo: Form.modelo.value
        }
    },

    //MÉTODO PARA VERIFICAR SE OS INPUTS FORAM PREENCHIDOS
    validateFields(){
        const{placa, categoria, marca, modelo} = Form.getValues()
        if(placa == "" || categoria == "" || marca == "" || modelo ==""){
            throw new Error("Preencha todos os campos para realizar a entrada do veículo")
        }
    },  

    //CONFERIR SE A PLACA JA EXISTE NO SISTEMA ANTES DE DAR ENTRADA
    validatePlacaEntrada(){
        let placaVeiculo = Form.getValues().placa
        Movement.veiculo.forEach( veiculo => {
            if(placaVeiculo.toUpperCase() == veiculo.placa.toUpperCase()){
                Form.clearInputFields()
                throw new Error("Placa ja cadastrada no sistema")
            }
        })
    },

    //MÉTODO RETORNA DATA HORA DA ENTRADA
    getHourDate(){
        let dateTimeEntrada = new Date()
        return dateTimeEntrada
    },

    //MÉTODO RETORNA HORA DA ENTRADA EM MILISECONDS
    getMiliseconds(){
        let entradaMiliseconds = Form.getHourDate()
        return entradaMiliseconds.getTime() 
    },

    //RETORNA HORA FORMATADA 
    FormatHour(){
        let formatedHour = Form.getHourDate()
        return Formatar.formatHour(formatedHour)
    },

    //RETORNA A DATA FORMATADA
    formatDate(){
        let formatedDate = Form.getHourDate()
        return Formatar.formatDate(formatedDate)
    },

    //CONTRUÇÃO DE OBJETO COM OS VALORES DE ENTRADA 
    construcaoObj(){
        let veiculo = Form.getValues()
        let veiculoUpperCased = {};
        for(var key in veiculo){
            veiculoUpperCased[key] = veiculo[key].toUpperCase()
        }

        const{placa,categoria,marca,modelo} = veiculoUpperCased
        const hour = Form.FormatHour()
        const date = Form.formatDate()
        const miliSeconds = Form.getMiliseconds()

        return{
            placa,
            categoria,
            marca,
            modelo,
            hour,
            date,
            miliSeconds
        }
    },

    //MÉTODO PARA LIMPAR CAMPOS INPUTS
    clearInputFields(){
        Form.placa.value = ""
        Form.marca.value = ""
        Form.modelo.value = ""
        document.getElementsByName('categoria')
            .forEach(categoria => {
                categoria.checked = false
            })
    },

    //MÉTODO INVOCADO NO EVENTO DE SUBMIT DO FORMULÁRIO DE ENTRADA
    submit(event){
        event.preventDefault()
       
        try{
            //VALIDAR INPUTS ENTRADA
            Form.validateFields()
            //VERIFICAR SE A PLACA JA NÃO FOI CADASTRADA
            Form.validatePlacaEntrada()
            const entradaVeiculo = Form.construcaoObj()
            //SALVAR 
            Movement.addMovimento(entradaVeiculo)
            //LIMPAR INPUTS 
            Form.clearInputFields()
            
        }
        catch(error){
            alert(error.message)
        }
    },
}


const FormSaida= {

    placaSaida: document.querySelector('#placa-out'),

    //VALIDAÇÃO INPUT SAÍDA
    validateFields(){
        if(FormSaida.placaSaida.value == ""){
            throw new Error("Preencha todos os campos para realizar a saída do veículo")
        }
    },

    //LIMPAR INPUT DE SAÍDA
    clearInputFields(){
        FormSaida.placaSaida.value = ""
    },

    //MÉTODO INVOCADO NO EVENTO DE SUBMIT DO FORMULÁRIO DE SAÍDA
    submit(event){
        event.preventDefault()
      
        try{
            //VALIDAR INPUT DE SAÍDA
            FormSaida.validateFields()
            let horaSaida = Form.getMiliseconds()
            let placaSaida = FormSaida.placaSaida.value
            //PASSAR O VEÍCULO E A HORA DE SAIDA 
            Movement.getStayedTime(Formatar.removeCharacter(placaSaida),horaSaida)
            //LIMPAR INPUT
            FormSaida.clearInputFields()

        }catch(error){
            alert(error.message)
        }
    }

}


const Formatar = {

    //FAZ A FORMATAÇÃO DA HORA PARA PADRÃO LOCAL
    formatHour(formatedHour){
      return formatedHour.toLocaleTimeString() 
    },

    //FAZ FORMATAÇÃO DA DATA PARA PADRÃO LOCAL
    formatDate(formatedDate){
        return formatedDate.toLocaleDateString()
    },

    //REMOVE CARATERE (-) DA PLACA
    removeCharacter(placaSaida){
        let placaFormatada = placaSaida.replace("-", "")
        return placaFormatada
    },

    //RETORNA PLACA FORMATADA COM (-) PARA UTILIZAR NA INTERFACE
    placaFormatada(placaVeiculo){
        let placa = placaVeiculo
        return placa.slice(0,3)+"-"+placa.slice(3)
    },

    //FORMATA VALORES MONETÁRIOS PARA O PADRÃO REAL
    formatCurency(value){
        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
        return  value
    },    
}


const App = { 
    //INICIA SCRIPT
    init(){
        //PARA CADA VEÍCULO ADICIONAR NA TELA TABELA
        Movement.veiculo.forEach( veiculo => {
            Dom.addMovimentacao(veiculo)
        })
   
       let value = localStorage.getItem("Valor") 
       let veiculo = JSON.parse(localStorage.getItem("veiculo")) 
        
       if(value == '"entrada"'){
           //chamar o display de entrada
           Dom.addDisplay(veiculo)
           document.querySelector('#display').style.display = "block"
       }
       else if(value != null && value != '"entrada"'){
           //chamar display saida
           let horaData = (localStorage.getItem("diaHora")).split(",") 
           Dom.addMovimentacaoFinal(veiculo,value,horaData[1],horaData[0])
           document.querySelector('#display').style.display = "block"
       }

       Dom.ShowTotal()
       Dom.innerHtmlValorTotal(localStorage.getItem("valorTotal"))

       Storage.set()
    },

    //METODO INVOCADO A CADA ALTERAÇÃO NA PAG FAZ RELOAD COM NOVAS INFORMAÇÕES
    reload(){
        Dom.clearTransactions()
        App.init()
    }
}

App.init()

