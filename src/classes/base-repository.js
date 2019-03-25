import {Axios} from '../helpers';


class BaseRepository {
  constructor(RepositoryConfig) {
    this.axios = Axios.createInstance();
    this.config = RepositoryConfig;
  }

  getSize(){

  }

  getContext(){

  }

  get(subject, predicate, object, inference, responseType) {

  }

  addTriple(subject, predicate, object, contexts){

  }

  deleteTriple(subject, predicate, object){

  }

  addFile(file){

  }

  updateFile(file) {

  }

  addRDFData(data){

  }

  updateRDFData(data){

  }

  query(query, infer, limit, offset, responseType){

  }

  getNamespace(prefix){

  }

  updateNamespace(prefix, namespace){

  }

  deleteNamespace(prefix){

  }
}
