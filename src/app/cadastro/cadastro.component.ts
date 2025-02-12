import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { z } from 'zod';
import axios from 'axios';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss'],
})
export class CadastroComponent {
  cadastroForm: FormGroup;
  errors: { [key: string]: string } = {};
  sucesso: string = '';
  cadastros: any[] = [];

  constructor(private fb: FormBuilder) {
    this.cadastroForm = this.fb.group({
      nome: [''],
      cpf: [''],
      dataNascimento: [''],
      email: [''],
      cep: [''],
      logradouro: [''],
      bairro: [''],
      cidade: [''],
      estado: [''],
    });
    this.carregarCadastros();
  }

  carregarCadastros() {
    const cadastrosSalvos = localStorage.getItem('cadastros');
    if (cadastrosSalvos) {
      this.cadastros = JSON.parse(cadastrosSalvos);
    } else {
      this.cadastros = [];
    }
  }

  salvarCadastro(cadastro: any) {
    this.cadastros.push(cadastro);
    localStorage.setItem('cadastros', JSON.stringify(this.cadastros));
  }

  excluirCadastro(index: number) {
    this.cadastros.splice(index, 1);
    localStorage.setItem('cadastros', JSON.stringify(this.cadastros));
  }

  calcularIdade(dataNascimento: string): number {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  onSubmit() {
    const formValue = this.cadastroForm.value;
    const result = schema.safeParse(formValue);

    if (result.success) {
      this.errors = {};
      const cadastro = {
        ...formValue,
        idade: this.calcularIdade(formValue.dataNascimento),
      };
      this.salvarCadastro(cadastro);
      this.cadastroForm.reset();
      this.sucesso = 'Cadastro realizado com sucesso!';
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      this.errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0];
        this.errors[field] = err.message;
      });
      this.sucesso = '';
    }

    setTimeout(() => {
      this.sucesso = '';
    }, 2000);
  }

  buscarEndereco() {
    const cep = this.cadastroForm.get('cep')?.value.replace(/\D/g, '');
    if (cep.length === 8) {
      axios
        .get(`https://viacep.com.br/ws/${cep}/json/`)
        .then((response) => {
          const data = response.data;
          if (data.erro) {
            this.errors['cep'] = 'CEP inválido';
          } else {
            this.cadastroForm.patchValue({
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              estado: data.uf,
            });
            this.errors['cep'] = '';
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  maskCpf(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    const formatted = value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    event.target.value = formatted;
  }

  maskCep(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 8) {
      value = value.substring(0, 8);
    }
    const formatted = value.replace(/^(\d{5})(\d)/, '$1-$2');
    event.target.value = formatted;
  }
}

const schema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(150, 'Máximo de 150 caracteres')
    .regex(/^[a-zA-ZÀ-ú\s]+$/, 'Nome inválido'),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
    .refine((val) => validarCpf(val), {
      message: 'CPF inválido',
    }),
  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida'),
  email: z
    .string()
    .email('E-mail inválido')
    .max(200, 'Máximo de 200 caracteres'),
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

function validarCpf(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');

  if (cpf.length !== 11) return false;

  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  let peso = 10;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * peso--;
  }
  let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (digito1 !== parseInt(cpf[9])) return false;

  soma = 0;
  peso = 11;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * peso--;
  }
  let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (digito2 !== parseInt(cpf[10])) return false;

  return true;
}
