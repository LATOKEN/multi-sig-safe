contract StorageSetter {
            bytes3 public data;

                function setStorage(bytes3 _data) public {
                    data = _data;
                }
            }