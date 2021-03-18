import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      const parsedCart = JSON.parse(storagedCart);
      return parsedCart;
    }

    return [];
  });
  const [stock, setStock] = useState<Stock>({} as Stock);

  const addProduct = async (productId: number) => {
    // TODO
    try {
      const responseStock = await api.get<Stock>(`stock/${productId}`);

      setStock(responseStock.data);

      const selectedProduct = cart.find((product) => product.id === productId);

      if (selectedProduct) {
        const amount = selectedProduct.amount + 1;
        await updateProductAmount({ productId, amount });
        return;
      }

      if (stock.amount < 1) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const { data: newProduct } = await api.get<Product>(
          `products/${productId}`
        );
        if (newProduct) {
          newProduct.amount = 1;
          setCart([...cart, newProduct]);
          localStorage.setItem(
            '@RocketShoes:cart',
            JSON.stringify([...cart, newProduct])
          );
          return;
        } else {
          throw new Error('Erro na adição do produto');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const itemExists = cart.find((product) => product.id === productId);

      if (!itemExists) {
        throw new Error('Erro na remoção do produto');
      }

      const itemRemovedFromCart = cart.filter(
        (product) => product.id !== productId
      );

      localStorage.setItem(
        '@RocketShoes:cart',
        JSON.stringify(itemRemovedFromCart)
      );
      setCart(itemRemovedFromCart);
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const { data: productStock } = await api.get<Stock>(
        `/stock/${productId}`
      );

      if (productStock.amount <= 1 || productStock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = cart.map((product) => {
        if (product.id === productId) {
          product.amount = amount;
        }
        return product;
      });

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
